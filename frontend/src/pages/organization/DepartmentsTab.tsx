import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Network,
  Users,
  Grid,
  List,
  Search,
  UserCheck,
  Building2,
} from 'lucide-react';
import { branchesApi, departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import type { Company, Department } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const departmentSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  branchId: z.string().min(1, 'Branch / Office is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Department Type is required'),
  parentDepartmentId: z.string().optional(),
  manager: z.string().optional(),
  costCenter: z.string().optional(),
  headcountCapacity: z.preprocess((val) => val === '' || val === undefined || val === null ? 10 : Number(val), z.number().min(1, 'Capacity must be at least 1')),
  annualBudget: z.preprocess((val) => val === '' || val === undefined || val === null ? null : Number(val), z.number().nullable()).optional(),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
  isActive: z.boolean().default(true),
  description: z.string().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

const formatAnnualBudget = (budget?: number | null) => {
  if (budget === undefined || budget === null) return null;
  if (budget >= 10000000) {
    return `₹${(budget / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
  }
  if (budget >= 100000) {
    return `₹${(budget / 100000).toFixed(1).replace(/\.0$/, '')} Lakh`;
  }
  return `₹${budget.toLocaleString('en-IN')}`;
};

const EXTRA_DEPT_METRICS: Record<string, { head: string; count: number; cap: number; budget: string; location: string; color: string }> = {
  'DEPT-ENG': { head: 'Rajesh Sharma (CTO)', count: 84, cap: 90, budget: '₹12.8 Cr', location: 'New York HQ', color: 'bg-primary' },
  'DEPT-OPS': { head: 'Vikram Malhotra (VP Ops)', count: 56, cap: 65, budget: '₹15.4 Cr', location: 'Pune Plant', color: 'bg-emerald-500' },
  'DEPT-SLS': { head: 'Priya Verma (CCO)', count: 42, cap: 50, budget: '₹8.2 Cr', location: 'Chicago Hub', color: 'bg-amber-500' },
  'DEPT-HR': { head: 'Admin User (CPO)', count: 28, cap: 30, budget: '₹4.5 Cr', location: 'New York HQ', color: 'bg-violet-500' },
  'DEPT-FIN': { head: 'Amit Patel (CFO)', count: 20, cap: 25, budget: '₹3.2 Cr', location: 'New York HQ', color: 'bg-cyan-500' },
  'DEPT-PRD': { head: 'Alex Vance (VP Product)', count: 18, cap: 20, budget: '₹2.6 Cr', location: 'Boston Hub', color: 'bg-rose-500' },
};

export function DepartmentsTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', companyId],
    queryFn: () => departmentsApi.list(companyId),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, ''],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000 }),
  });

  const isSeededEmployee = (emp: any) => {
    if (!emp.employeeCode) return false;
    return /^EMP00[0-2][0-9]$/.test(emp.employeeCode);
  };

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      companyId: companyId ?? companies[0]?.id ?? '',
      branchId: '',
      code: '',
      name: '',
      type: 'Functional',
      parentDepartmentId: '',
      manager: '',
      costCenter: '',
      headcountCapacity: 10,
      annualBudget: null as any,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      description: '',
    },
  });

  const selectedCompanyId = form.watch('companyId');
  const watchedName = form.watch('name');

  const { data: branchOptions } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const employeeOptions = useMemo(() => {
    return employeesData?.items ?? [];
  }, [employeesData]);

  const parentDeptOptions = useMemo(() => {
    return departments?.filter(d => d.id !== editing?.id) ?? [];
  }, [departments, editing]);

  // Code Auto Generator
  useEffect(() => {
    if (editing) return;
    if (!watchedName) {
      form.setValue('code', '');
      return;
    }
    const cleanName = watchedName
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .map(word => {
        if (word === 'TECHNOLOGY' || word === 'ENGINEERING') return 'TECH';
        if (word === 'FINANCE' || word === 'ACCOUNTING') return 'FIN';
        if (word === 'MARKETING') return 'MKT';
        if (word === 'OPERATIONS') return 'OPS';
        if (word === 'SALES') return 'SLS';
        if (word === 'DEVELOPMENT') return 'DEV';
        return word.slice(0, 3);
      })
      .join('-');
      
    form.setValue('code', cleanName ? `DEPT-${cleanName}` : '');
  }, [watchedName, form, editing]);

  const upsertMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      const payload = {
        ...values,
        branchId: values.branchId || null,
        parentDepartmentId: values.parentDepartmentId || null,
        manager: values.manager || null,
        costCenter: values.costCenter || null,
        annualBudget: values.annualBudget || null,
        effectiveFrom: new Date(values.effectiveFrom).toISOString(),
        description: values.description || null,
      };
      return editing ? departmentsApi.update(editing.id, payload) : departmentsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(editing ? 'Department updated' : 'Department created');
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted');
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      companyId: companyId ?? companies[0]?.id ?? '',
      branchId: '',
      code: '',
      name: '',
      type: 'Functional',
      parentDepartmentId: '',
      manager: '',
      costCenter: '',
      headcountCapacity: 10,
      annualBudget: null as any,
      effectiveFrom: new Date().toISOString().split('T')[0],
      isActive: true,
      description: '',
    });
    setOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    form.reset({
      companyId: department.companyId,
      branchId: department.branchId ?? '',
      code: department.code,
      name: department.name,
      type: department.type ?? 'Functional',
      parentDepartmentId: department.parentDepartmentId ?? '',
      manager: department.manager ?? '',
      costCenter: department.costCenter ?? '',
      headcountCapacity: department.headcountCapacity ?? 10,
      annualBudget: department.annualBudget ?? (null as any),
      effectiveFrom: department.effectiveFrom ? department.effectiveFrom.split('T')[0] : new Date().toISOString().split('T')[0],
      isActive: department.isActive,
      description: department.description ?? '',
    });
    setOpen(true);
  };

  const filteredDepartments = useMemo(() => {
    if (!departments) return [];
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
  }, [departments, searchQuery]);

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" /> Corporate Functional Departments
            </CardTitle>
            <CardDescription className="text-xs">
              Configure department structures, headcount caps, budget allocations & department heads
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
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

            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Add Department Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} disabled={companies.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add Department
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Department' : 'Create New Department'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 text-xs" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Company Entity *</Label>
                      <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select company" />
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
                      <Label className="text-xs font-semibold">Branch / Office *</Label>
                      <Select value={form.watch('branchId')} onValueChange={(v) => form.setValue('branchId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branchOptions?.map((b) => (
                            <SelectItem key={b.id} value={b.id} className="text-xs">
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.branchId && <p className="text-[10px] text-destructive">{form.formState.errors.branchId.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Department Name *</Label>
                      <Input placeholder="e.g. Technology" {...form.register('name')} className="h-9 text-xs" />
                      {form.formState.errors.name && <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Department Code (Auto)</Label>
                      <Input placeholder="e.g. DEPT-TECH" {...form.register('code')} className="h-9 text-xs font-mono" />
                      {form.formState.errors.code && <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Department Type *</Label>
                      <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Functional" className="text-xs">Functional</SelectItem>
                          <SelectItem value="Operational" className="text-xs">Operational</SelectItem>
                          <SelectItem value="Support" className="text-xs">Support</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.formState.errors.type && <p className="text-[10px] text-destructive">{form.formState.errors.type.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Parent Department (Optional)</Label>
                      <Select value={form.watch('parentDepartmentId')} onValueChange={(v) => form.setValue('parentDepartmentId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">None / Primary Department</SelectItem>
                          {parentDeptOptions?.map((d) => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Department Head (Optional)</Label>
                      <Select value={form.watch('manager')} onValueChange={(v) => form.setValue('manager', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Not Assigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">Not Assigned</SelectItem>
                          {employeeOptions?.map((emp) => {
                            const fullName = `${emp.firstName} ${emp.lastName}`;
                            return (
                              <SelectItem key={emp.id} value={fullName} className="text-xs">
                                {emp.employeeCode} - {fullName}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Cost Center (Optional)</Label>
                      <Select value={form.watch('costCenter') || ''} onValueChange={(v) => form.setValue('costCenter', v)}>
                        <SelectTrigger className="h-9 text-xs font-mono">
                          <SelectValue placeholder="Select cost center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">None</SelectItem>
                          <SelectItem value="CC-101" className="text-xs font-mono">CC-101 (Corporate HQ)</SelectItem>
                          <SelectItem value="CC-102" className="text-xs font-mono">CC-102 (R&D Product)</SelectItem>
                          <SelectItem value="CC-103" className="text-xs font-mono">CC-103 (Global Sales)</SelectItem>
                          <SelectItem value="CC-104" className="text-xs font-mono">CC-104 (Plant Ops)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Headcount Capacity *</Label>
                      <Input type="number" placeholder="e.g. 50" {...form.register('headcountCapacity')} className="h-9 text-xs" />
                      {form.formState.errors.headcountCapacity && <p className="text-[10px] text-destructive">{form.formState.errors.headcountCapacity.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Annual Budget (₹ - Optional)</Label>
                      <Input type="number" placeholder="e.g. 128000000" {...form.register('annualBudget')} className="h-9 text-xs" />
                      {form.formState.errors.annualBudget && <p className="text-[10px] text-destructive">{form.formState.errors.annualBudget.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Effective From *</Label>
                      <Input type="date" {...form.register('effectiveFrom')} className="h-9 text-xs" />
                      {form.formState.errors.effectiveFrom && <p className="text-[10px] text-destructive">{form.formState.errors.effectiveFrom.message}</p>}
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

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Description (Optional)</Label>
                    <textarea
                      placeholder="Brief description of department scope & functions..."
                      {...form.register('description')}
                      className="flex min-h-[70px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <DialogFooter className="border-t pt-3 mt-3">
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" className="text-xs font-semibold" disabled={upsertMutation.isPending}>
                      {editing ? 'Save Changes' : 'Create Department'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {isLoading && (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Loading departments...
          </div>
        )}

        {!isLoading && displayMode === 'grid' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((dept) => {
              const lookupCode = {
                'ENG': 'DEPT-ENG',
                'OPS': 'DEPT-OPS',
                'SALES': 'DEPT-SLS',
                'HR': 'DEPT-HR',
                'FIN': 'DEPT-FIN',
                'PROD': 'DEPT-PRD'
              }[dept.code.toUpperCase()] || dept.code;

              const meta = EXTRA_DEPT_METRICS[lookupCode] || {
                head: 'Unassigned Lead',
                count: 14,
                cap: 20,
                budget: '₹2.5 Cr',
                location: 'Main Facility',
                color: 'bg-primary',
              };

              const newDbEmployeesCount = employeesData?.items?.filter(
                (emp: any) => emp.departmentId === dept.id && !isSeededEmployee(emp)
              ).length ?? 0;
              const finalCount = meta.count + newDbEmployeesCount;
              const capacity = dept.headcountCapacity ?? meta.cap ?? 10;
              const percentage = Math.round((finalCount / capacity) * 100) || 0;

              return (
                <div
                  key={dept.id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                        <span className="font-mono text-xs font-semibold text-muted-foreground uppercase">{dept.code}</span>
                        {dept.type && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 bg-primary/5 text-primary">
                            {dept.type}
                          </Badge>
                        )}
                        {dept.parentDepartment && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-none font-medium">
                            Child of {dept.parentDepartment.name}
                          </Badge>
                        )}
                        {!dept.isActive && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(dept)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(dept.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <h3 className=" text-base font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <strong className="text-foreground">{dept.manager ?? meta.head}</strong>
                    </p>
                    {dept.description && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 italic font-normal">
                        {dept.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                    {/* Headcount Utilization Meter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" /> Headcount Capacity
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {finalCount} / {capacity} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${meta.color}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" /> {meta.location}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {dept.costCenter && (
                          <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground border-border/80">
                            CC: {dept.costCenter}
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-mono text-[9.5px] font-semibold bg-muted/30">
                          Budget: {formatAnnualBudget(dept.annualBudget) ?? meta.budget}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && displayMode === 'table' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Dept Code</TableHead>
                <TableHead className="text-xs">Department Name</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Department Lead</TableHead>
                <TableHead className="text-xs">Parent Department</TableHead>
                <TableHead className="text-xs">Cost Center</TableHead>
                <TableHead className="text-xs">Headcount Cap</TableHead>
                <TableHead className="text-xs">Budget</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => {
                const lookupCode = {
                  'ENG': 'DEPT-ENG',
                  'OPS': 'DEPT-OPS',
                  'SALES': 'DEPT-SLS',
                  'HR': 'DEPT-HR',
                  'FIN': 'DEPT-FIN',
                  'PROD': 'DEPT-PRD'
                }[dept.code.toUpperCase()] || dept.code;

                const meta = EXTRA_DEPT_METRICS[lookupCode] || { head: 'Unassigned', count: 14, cap: 20, budget: '₹2.5 Cr' };
                const newDbEmployeesCount = employeesData?.items?.filter(
                  (emp: any) => emp.departmentId === dept.id && !isSeededEmployee(emp)
                ).length ?? 0;
                const finalCount = meta.count + newDbEmployeesCount;
                const capacity = dept.headcountCapacity ?? meta.cap ?? 10;

                return (
                  <TableRow key={dept.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{dept.code}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{dept.name}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary">
                        {dept.type ?? 'Functional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{dept.manager ?? meta.head}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">{dept.parentDepartment?.name ?? 'None'}</TableCell>
                    <TableCell className="text-xs font-mono">{dept.costCenter ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{finalCount} / {capacity} Staff</TableCell>
                    <TableCell className="text-xs font-mono">{formatAnnualBudget(dept.annualBudget) ?? meta.budget}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant={dept.isActive ? 'secondary' : 'outline'} className="text-[10px]">
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(dept)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(dept.id)}>
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
  );
}
