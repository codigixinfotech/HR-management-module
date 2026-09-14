import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Award, Search, Briefcase } from 'lucide-react';
import { departmentsApi, designationsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { payGradesApi } from '@/api/cost-grades';
import type { Company, Designation } from '@/api/types';
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

const designationSchema = z.object({
  companyId: z.string().min(1, 'Organization Entity is required'),
  departmentId: z.string().min(1, 'Department is required'),
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  jobFamily: z.string().optional(),
  grade: z.string().min(1, 'Grade band is required'),
  reportingDesignationId: z.string().optional(),
  employmentType: z.string().optional(),
  minSalary: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  maxSalary: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

const getDesigSalaryMultiplier = (unit: string) => {
  if (unit === '₹ Crore') return 10000000;
  if (unit === '₹ Lakh') return 100000;
  if (unit === '₹ Thousand') return 1000;
  return 1;
};

const parseSalaryToValueAndUnit = (val?: number | null) => {
  if (!val || val <= 0) return { value: '', unit: '₹ Lakh' };
  
  // If val is less than 100,000, it's a monthly salary figure (e.g., 20,000 or 27,000).
  // Convert to annual package by multiplying by 12.
  let annualVal = val;
  if (val < 100000) {
    annualVal = val * 12;
  }

  if (annualVal >= 10000000) {
    const cr = (annualVal / 10000000).toFixed(2).replace(/\.?0+$/, '');
    return { value: cr, unit: '₹ Crore' };
  }
  if (annualVal >= 100000) {
    const lk = (annualVal / 100000).toFixed(2).replace(/\.?0+$/, '');
    return { value: lk, unit: '₹ Lakh' };
  }
  if (annualVal >= 1000) {
    const th = (annualVal / 1000).toFixed(2).replace(/\.?0+$/, '');
    return { value: th, unit: '₹ Thousand' };
  }
  return { value: annualVal.toString(), unit: '₹' };
};

const formatSalaryVal = (val: number) => {
  if (val >= 10000000) {
    const cr = (val / 10000000).toFixed(2).replace(/\.?0+$/, '');
    return `₹${cr} Cr`;
  }
  if (val >= 100000) {
    const lk = (val / 100000).toFixed(2).replace(/\.?0+$/, '');
    return `₹${lk} Lakh`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(0)}K`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
};

const formatSalaryRange = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Not Specified';
  
  const minAnnual = min ? (min < 100000 ? min * 12 : min) : null;
  const maxAnnual = max ? (max < 100000 ? max * 12 : max) : null;

  if (minAnnual && maxAnnual) {
    if (minAnnual >= 100000 && maxAnnual >= 100000 && minAnnual < 10000000 && maxAnnual < 10000000) {
      const minL = (minAnnual / 100000).toFixed(2).replace(/\.?0+$/, '');
      const maxL = (maxAnnual / 100000).toFixed(2).replace(/\.?0+$/, '');
      return `₹${minL} – ₹${maxL} Lakh`;
    }
    if (minAnnual >= 10000000 && maxAnnual >= 10000000) {
      const minC = (minAnnual / 10000000).toFixed(2).replace(/\.?0+$/, '');
      const maxC = (maxAnnual / 10000000).toFixed(2).replace(/\.?0+$/, '');
      return `₹${minC} – ₹${maxC} Crore`;
    }
    return `${formatSalaryVal(minAnnual)} – ${formatSalaryVal(maxAnnual)}`;
  }
  if (minAnnual) return `Min: ${formatSalaryVal(minAnnual)}`;
  return `Max: ${formatSalaryVal(maxAnnual!)}`;
};

type DesignationFormValues = z.infer<typeof designationSchema>;

const GRADE_COLOR_MAP: Record<string, { label: string; badge: string }> = {
  'E1': { label: 'Executive E1', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  'E2': { label: 'Executive E2', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  'E3': { label: 'Senior Executive E3', badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  'M1': { label: 'Manager M1', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'M2': { label: 'Senior Manager M2', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'L1': { label: 'Director / VP L1', badge: 'bg-violet-500/10 text-violet-600 border-violet-500/20' },
  'L2': { label: 'CXO / Managing Officer L2', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
};

export function DesignationsTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isBranchAdmin = isBranchAdminUser(user);
  const assignedBranchId = user?.branchId || user?.employee?.branchId;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [minAnnualVal, setMinAnnualVal] = useState<string>('');
  const [minAnnualUnit, setMinAnnualUnit] = useState<string>('₹ Lakh');
  const [maxAnnualVal, setMaxAnnualVal] = useState<string>('');
  const [maxAnnualUnit, setMaxAnnualUnit] = useState<string>('₹ Lakh');

  const form = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema) as any,
    defaultValues: {
      companyId: companyId ?? companies[0]?.id ?? '',
      departmentId: '',
      code: '',
      title: '',
      jobFamily: 'Engineering',
      grade: 'E2',
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

  const { data: payGradesList } = useQuery({
    queryKey: ['pay-grades', selectedCompanyId],
    queryFn: () => payGradesApi.list(selectedCompanyId),
  });

  const watchedTitle = form.watch('title');

  // Code Auto Generator
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

  const { data: departmentOptions } = useQuery({
    queryKey: ['departments', selectedCompanyId],
    queryFn: () => departmentsApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: DesignationFormValues) => {
      const calcMin = minAnnualVal !== '' && !isNaN(Number(minAnnualVal)) ? Number(minAnnualVal) * getDesigSalaryMultiplier(minAnnualUnit) : null;
      const calcMax = maxAnnualVal !== '' && !isNaN(Number(maxAnnualVal)) ? Number(maxAnnualVal) * getDesigSalaryMultiplier(maxAnnualUnit) : null;

      const payload = {
        ...values,
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

  const openCreate = () => {
    setEditing(null);
    setMinAnnualVal('');
    setMinAnnualUnit('₹ Lakh');
    setMaxAnnualVal('');
    setMaxAnnualUnit('₹ Lakh');
    form.reset({
      companyId: companyId ?? companies[0]?.id ?? '',
      departmentId: '',
      code: '',
      title: '',
      jobFamily: 'Engineering',
      grade: 'E2',
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
    const minP = parseSalaryToValueAndUnit(designation.minSalary);
    setMinAnnualVal(minP.value);
    setMinAnnualUnit(minP.unit);

    const maxP = parseSalaryToValueAndUnit(designation.maxSalary);
    setMaxAnnualVal(maxP.value);
    setMaxAnnualUnit(maxP.unit);

    form.reset({
      companyId: designation.companyId,
      departmentId: designation.departmentId ?? '',
      code: designation.code,
      title: designation.title,
      jobFamily: designation.jobFamily ?? 'Engineering',
      grade: designation.grade ?? 'E2',
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
    return designations.filter(d => d.title.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || (d.grade && d.grade.toLowerCase().includes(q)));
  }, [designations, searchQuery]);

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" /> Career Job Designations & Grade Bands
            </CardTitle>
            <CardDescription className="text-xs">
              Job titles, compensation scale bands & department mappings across executive tiers
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
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

            {/* Add Designation Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} disabled={companies.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add Designation
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Job Designation' : 'Create New Designation'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 text-xs" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Organization Entity *</Label>
                      <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.companyId && <p className="text-[10px] text-destructive">{form.formState.errors.companyId.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Mapped Department *</Label>
                      <Select value={form.watch('departmentId')} onValueChange={(v) => form.setValue('departmentId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions?.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.departmentId && <p className="text-[10px] text-destructive">{form.formState.errors.departmentId.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Designation Code (Auto)</Label>
                      <Input placeholder="e.g. DESG-101" {...form.register('code')} className="h-9 text-xs font-mono" />
                      {form.formState.errors.code && <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Job Designation Title *</Label>
                      <Input placeholder="e.g. Senior Software Engineer" {...form.register('title')} className="h-9 text-xs" />
                      {form.formState.errors.title && <p className="text-[10px] text-destructive">{form.formState.errors.title.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Pay Grade / Level *</Label>
                      <Select value={form.watch('grade')} onValueChange={(v) => {
                        form.setValue('grade', v);
                        const selectedGrade = payGradesList?.find(g => g.gradeCode === v);
                        if (selectedGrade) {
                          form.setValue('minSalary', Number(selectedGrade.minSalary));
                          form.setValue('maxSalary', Number(selectedGrade.maxSalary));
                          if (selectedGrade.minSalary) {
                            const minP = parseSalaryToValueAndUnit(Number(selectedGrade.minSalary));
                            setMinAnnualVal(minP.value);
                            setMinAnnualUnit(minP.unit);
                          }
                          if (selectedGrade.maxSalary) {
                            const maxP = parseSalaryToValueAndUnit(Number(selectedGrade.maxSalary));
                            setMaxAnnualVal(maxP.value);
                            setMaxAnnualUnit(maxP.unit);
                          }
                        }
                      }}>
                        <SelectTrigger className="h-9 text-xs font-mono">
                          <SelectValue placeholder="Select grade band" />
                        </SelectTrigger>
                        <SelectContent>
                          {payGradesList?.map((g) => (
                            <SelectItem key={g.id} value={g.gradeCode} className="text-xs font-mono">
                              {g.gradeCode} - {g.gradeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.grade && <p className="text-[10px] text-destructive">{form.formState.errors.grade.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Reporting Designation (Optional)</Label>
                      <Select value={form.watch('reportingDesignationId') || 'none'} onValueChange={(v) => form.setValue('reportingDesignationId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select reporting line" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">None (Reports to MD/Self)</SelectItem>
                          {designations?.filter(d => d.id !== editing?.id).map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.title} ({d.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Employment Type (Optional)</Label>
                      <Select value={form.watch('employmentType')} onValueChange={(v) => form.setValue('employmentType', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
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
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active" className="text-xs">Active</SelectItem>
                          <SelectItem value="inactive" className="text-xs">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 border border-border/60 rounded-lg p-3 bg-muted/20">
                    <Label className="text-xs font-semibold text-foreground">Annual Package / CTC Range (Optional)</Label>
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
                            <SelectTrigger className="h-9 w-[120px] text-xs shrink-0 font-medium">
                              <SelectValue />
                            </SelectTrigger>
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
                            <SelectTrigger className="h-9 w-[120px] text-xs shrink-0 font-medium">
                              <SelectValue />
                            </SelectTrigger>
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Effective From *</Label>
                      <Input type="date" {...form.register('effectiveFrom')} className="h-9 text-xs" />
                      {form.formState.errors.effectiveFrom && <p className="text-[10px] text-destructive">{form.formState.errors.effectiveFrom.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Description (Optional)</Label>
                    <textarea
                      placeholder="Role responsibilities and department alignment..."
                      {...form.register('description')}
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

      <CardContent className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Designation Title</TableHead>
              <TableHead className="text-xs">Mapped Department</TableHead>
              <TableHead className="text-xs">Grade Band</TableHead>
              <TableHead className="text-xs">Reports To</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Salary Range</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Employee Count</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
                  Loading designations...
                </TableCell>
              </TableRow>
            )}
            {filteredDesignations.map((designation) => {
              const gradeCode = designation.grade || 'E2';
              const gradeMeta = GRADE_COLOR_MAP[gradeCode] || { label: gradeCode, badge: 'bg-muted text-foreground' };

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
                    <Badge className={`text-[10px] font-mono font-semibold ${gradeMeta.badge}`}>
                      Grade {gradeCode} ({gradeMeta.label})
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {designation.reportingDesignation?.title ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs font-medium">
                    {designation.employmentType ?? '—'}
                  </TableCell>
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
                        if (isBranchAdmin && assignedBranchId) {
                          return emp.branchId === assignedBranchId;
                        }
                        return true;
                      }).length ?? 0;
                      return count;
                    })()} Staff
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
                <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-8">
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
