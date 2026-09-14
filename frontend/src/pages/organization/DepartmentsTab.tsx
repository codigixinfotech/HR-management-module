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
  GitFork,
  X,
} from 'lucide-react';
import { formatIndianBudget } from '@/lib/utils';
import { branchesApi, departmentsApi } from '@/api/organization';
import { employeesApi } from '@/api/employees';
import { costCentersApi } from '@/api/cost-grades';
import type { Company, Department } from '@/api/types';
import { useAuthStore } from '@/stores/auth-store';
import { isSuperAdminUser, isBranchAdminUser } from '@/lib/modules';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const departmentSchema = z.object({
  companyId: z.string().min(1, 'Organization Entity is required'),
  branchId: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.string().optional().default('Functional'),
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

// formatIndianBudget imported from @/lib/utils — used for all budget display

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
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = isSuperAdminUser(user);
  const isBranchAdmin = isBranchAdminUser(user);
  const assignedBranchId = user?.branchId || user?.employee?.branchId;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');
  // Raw rupee input — user types "28000000" and we auto-display "₹28 Crore"
  const [deptBudgetRaw, setDeptBudgetRaw] = useState<string>('');

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(() => {
    if (isBranchAdmin && assignedBranchId) return assignedBranchId;
    return 'ALL';
  });

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  useEffect(() => {
    if (isBranchAdmin && assignedBranchId) {
      setSelectedBranchFilter(assignedBranchId);
    }
  }, [isBranchAdmin, assignedBranchId]);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema) as any,
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

  const effectiveCompanyId = companyId || companies[0]?.id || '';
  const selectedCompanyId = form.watch('companyId') || effectiveCompanyId;
  const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);

  useEffect(() => {
    if (!isBranchAdmin) {
      setSelectedBranchFilter('ALL');
    }
    setSelectedDeptFilter('ALL');
  }, [companyId, isBranchAdmin]);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', selectedCompanyId],
    queryFn: () => departmentsApi.list(selectedCompanyId),
  });

  const effectiveBranchIdForQuery = isBranchAdmin && assignedBranchId ? assignedBranchId : (selectedBranchFilter !== 'ALL' ? selectedBranchFilter : undefined);
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, '', selectedCompanyId, effectiveBranchIdForQuery || 'ALL'],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 1000, companyId: selectedCompanyId, branchId: effectiveBranchIdForQuery }),
  });

  const { data: costCentersList } = useQuery({
    queryKey: ['cost-centers', selectedCompanyId],
    queryFn: () => costCentersApi.list(selectedCompanyId),
  });

  const watchedName = form.watch('name');

  const { data: branchOptions } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const filteredBranches = useMemo(() => {
    if (!selectedCompanyId || !branchOptions) return [];
    return branchOptions.filter((b: any) => {
      // Must belong to this company if companyId is specified on branch
      if (b.companyId && b.companyId !== selectedCompanyId) return false;
      const bName = (b.name || '').trim().toLowerCase();
      if (selectedCompany) {
        const cName = (selectedCompany.name || '').trim().toLowerCase();
        const cCode = (selectedCompany.code || '').trim().toLowerCase();
        // Do NOT show company name or code as branch
        if (bName === cName || bName === cCode) return false;
      }
      // Exclude generic fake company/parent office branch entries
      if (
        bName === 'parent office/company' ||
        bName === 'parent company' ||
        bName === 'parent office' ||
        bName === 'head office / company' ||
        bName === 'cravita technology pvt ltd'
      ) {
        return false;
      }
      return true;
    });
  }, [branchOptions, selectedCompanyId, selectedCompany]);

  const branchMap = useMemo(() => {
    const map = new Map<string, string>();
    (branchOptions || []).forEach((b: any) => {
      map.set(b.id, b.name);
    });
    return map;
  }, [branchOptions]);

  // Group departments by scope (Head Office vs Branches)
  const headOfficeDepartments = useMemo(() => {
    return (departments || []).filter((d) => !d.branchId && !d.branch?.id);
  }, [departments]);

  const availableDeptsForDropdown = useMemo(() => {
    if (!departments) return [];
    if (selectedBranchFilter === 'HEAD_OFFICE') {
      return headOfficeDepartments;
    }
    if (selectedBranchFilter !== 'ALL') {
      return departments.filter((d) => d.branchId === selectedBranchFilter || d.branch?.id === selectedBranchFilter);
    }
    return departments;
  }, [departments, selectedBranchFilter, headOfficeDepartments]);

  const branchDepartmentGroups = useMemo(() => {
    const groups: { branchId: string; branchName: string; depts: Department[] }[] = [];
    filteredBranches.forEach((br) => {
      const depts = (departments || []).filter((d) => d.branchId === br.id || d.branch?.id === br.id);
      if (depts.length > 0) {
        groups.push({ branchId: br.id, branchName: br.name, depts });
      }
    });
    return groups;
  }, [filteredBranches, departments]);

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
      // Store raw rupees — no unit conversion needed
      const computedBudget =
        deptBudgetRaw !== '' && !isNaN(Number(deptBudgetRaw)) && Number(deptBudgetRaw) > 0
          ? Math.round(Number(deptBudgetRaw))
          : null;

      const cleanBranchId = values.branchId && values.branchId !== 'NONE' ? values.branchId : null;

      const payload = {
        ...values,
        branchId: cleanBranchId,
        parentDepartmentId: values.parentDepartmentId || null,
        manager: values.manager || null,
        costCenter: values.costCenter || null,
        annualBudget: computedBudget,
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
    setDeptBudgetRaw('');
    form.reset({
      companyId: selectedCompanyId,
      branchId: selectedBranchFilter !== 'ALL' ? selectedBranchFilter : '',
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

    const rawBudget = department.annualBudget ? Number(department.annualBudget) : null;
    // Pre-fill the raw rupee amount; formatter will show auto-preview
    setDeptBudgetRaw(rawBudget && rawBudget > 0 ? String(rawBudget) : '');

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
    let list = departments;
    if (selectedBranchFilter === 'HEAD_OFFICE') {
      list = list.filter(d => !d.branchId && !d.branch?.id);
    } else if (selectedBranchFilter !== 'ALL') {
      list = list.filter(d => d.branchId === selectedBranchFilter || d.branch?.id === selectedBranchFilter);
    }
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter(d => d.id === selectedDeptFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.manager && d.manager.toLowerCase().includes(q)) ||
        (d.branch?.name && d.branch.name.toLowerCase().includes(q))
    );
  }, [departments, selectedBranchFilter, selectedDeptFilter, searchQuery]);

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" /> Functional Departments
            </CardTitle>
            <CardDescription className="text-xs">
              Configure department structures, headcount caps, budget allocations & department heads
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
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

            {/* Branch Filter Dropdown */}
            <div className="w-48 sm:w-56">
              <Select
                value={selectedBranchFilter}
                onValueChange={(val) => {
                  setSelectedBranchFilter(val);
                  setSelectedDeptFilter('ALL');
                }}
                disabled={isBranchAdmin}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <GitFork className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue placeholder="All Branches & Offices">
                      {selectedBranchFilter === 'ALL'
                        ? 'All Branches & Offices'
                        : selectedBranchFilter === 'HEAD_OFFICE'
                        ? 'Corporate / Head Office'
                        : filteredBranches.find((b) => b.id === selectedBranchFilter)?.name}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {!isBranchAdmin && (
                    <>
                      <SelectItem value="ALL" className="text-xs font-semibold">
                        All Branches &amp; Offices
                      </SelectItem>
                      <SelectItem value="HEAD_OFFICE" className="text-xs font-medium">
                        Corporate / Head Office
                      </SelectItem>
                    </>
                  )}
                  {filteredBranches.map((br) => (
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

            {/* Department Filter Dropdown (Grouped by Scope with tree glyphs) */}
            <div className="w-52 sm:w-60">
              <Select
                value={selectedDeptFilter}
                onValueChange={(val) => setSelectedDeptFilter(val)}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border/80 font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Network className="h-3.5 w-3.5 text-primary shrink-0" />
                    <SelectValue placeholder="All Departments">
                      {selectedDeptFilter === 'ALL'
                        ? 'All Departments'
                        : departments?.find((d) => d.id === selectedDeptFilter)?.name}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-semibold">
                    All Departments
                  </SelectItem>
                  {selectedBranchFilter === 'HEAD_OFFICE' ? (
                    headOfficeDepartments.map((d, idx) => {
                      const isLast = idx === headOfficeDepartments.length - 1;
                      return (
                        <SelectItem key={d.id} value={d.id} className="text-xs pl-4 font-normal">
                          <span className="font-mono text-muted-foreground mr-1.5">{isLast ? '└─' : '├─'}</span>
                          <span>{d.name}</span>
                          {d.code && <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">({d.code})</span>}
                        </SelectItem>
                      );
                    })
                  ) : selectedBranchFilter !== 'ALL' ? (
                    availableDeptsForDropdown.map((d, idx) => {
                      const isLast = idx === availableDeptsForDropdown.length - 1;
                      return (
                        <SelectItem key={d.id} value={d.id} className="text-xs pl-4 font-normal">
                          <span className="font-mono text-muted-foreground mr-1.5">{isLast ? '└─' : '├─'}</span>
                          <span>{d.name}</span>
                          {d.code && <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">({d.code})</span>}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <>
                      {headOfficeDepartments.length > 0 && (
                        <SelectGroup>
                          <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            Company / Head Office
                          </SelectLabel>
                          {headOfficeDepartments.map((d, idx) => {
                            const isLast = idx === headOfficeDepartments.length - 1;
                            return (
                              <SelectItem key={d.id} value={d.id} className="text-xs pl-4 font-normal">
                                <span className="font-mono text-muted-foreground mr-1.5">{isLast ? '└─' : '├─'}</span>
                                <span>{d.name}</span>
                                {d.code && <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">({d.code})</span>}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      )}
                      {branchDepartmentGroups.map((bg) => (
                        <SelectGroup key={bg.branchId}>
                          <SelectLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                            {bg.branchName}
                          </SelectLabel>
                          {bg.depts.map((d, idx) => {
                            const isLast = idx === bg.depts.length - 1;
                            return (
                              <SelectItem key={d.id} value={d.id} className="text-xs pl-4 font-normal">
                                <span className="font-mono text-muted-foreground mr-1.5">{isLast ? '└─' : '├─'}</span>
                                <span>{d.name}</span>
                                {d.code && <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">({d.code})</span>}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filter Button if active and not branch admin */}
            {!isBranchAdmin && (selectedBranchFilter !== 'ALL' || selectedDeptFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={() => {
                  setSelectedBranchFilter('ALL');
                  setSelectedDeptFilter('ALL');
                }}
                title="Clear filters"
              >
                <X className="h-3 w-3" /> Clear
              </Button>
            )}

            {/* Search Input */}
            <div className="relative w-40 sm:w-52">
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
                      <Label className="text-xs font-semibold">Organization Entity *</Label>
                      <Select
                        value={form.watch('companyId')}
                        onValueChange={(v) => {
                          form.setValue('companyId', v);
                          form.setValue('branchId', '');
                        }}
                      >
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
                      <Label className="text-xs font-semibold">
                        <span>
                          Branch / Office
                          {filteredBranches.length > 0 && (
                            <span className="text-muted-foreground font-normal ml-1">(Optional)</span>
                          )}
                        </span>
                      </Label>
                      {filteredBranches.length === 0 ? (
                        <div className="h-9 px-3 py-2 rounded-md border text-xs bg-muted/20 text-foreground flex items-center justify-between border-dashed">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Head Office / No Branch
                          </span>
                          <Badge variant="outline" className="text-[10px] bg-background text-emerald-600 border-emerald-500/30">
                            Head Office
                          </Badge>
                        </div>
                      ) : (
                        <Select
                          value={form.watch('branchId') || 'NONE'}
                          onValueChange={(val) => form.setValue('branchId', val === 'NONE' ? '' : val)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Select branch (Optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE" className="text-xs text-muted-foreground italic">
                              Head Office / No Branch
                            </SelectItem>
                            {filteredBranches.map((b) => (
                              <SelectItem key={b.id} value={b.id} className="text-xs">
                                {b.name} {b.city ? `(${b.city})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {form.formState.errors.branchId && <p className="text-[10px] text-destructive">{form.formState.errors.branchId.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Department Name *</Label>
                      <Input placeholder="" {...form.register('name')} className="h-9 text-xs" />
                      {form.formState.errors.name && <p className="text-[10px] text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Department Code (Auto)</Label>
                      <Input placeholder="" {...form.register('code')} className="h-9 text-xs font-mono" />
                      {form.formState.errors.code && <p className="text-[10px] text-destructive">{form.formState.errors.code.message}</p>}
                    </div>
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
                          {costCentersList?.map((cc) => (
                            <SelectItem key={cc.id} value={cc.code} className="text-xs font-mono">
                              {cc.code} ({cc.name})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Headcount Capacity *</Label>
                      <Input type="number" placeholder="" {...form.register('headcountCapacity')} className="h-9 text-xs" />
                      {form.formState.errors.headcountCapacity && <p className="text-[10px] text-destructive">{form.formState.errors.headcountCapacity.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Annual Budget (Optional)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold pointer-events-none">₹</span>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder=""
                          value={deptBudgetRaw}
                          onChange={e => setDeptBudgetRaw(e.target.value)}
                          className="h-9 text-xs font-mono pl-6"
                        />
                      </div>
                      {/* Live auto-format preview */}
                      {deptBudgetRaw && Number(deptBudgetRaw) > 0 && (
                        <p className="text-[10px] text-primary font-semibold">
                          → Will be stored &amp; displayed as:{' '}
                          <span className="font-mono">{formatIndianBudget(Number(deptBudgetRaw))}</span>
                        </p>
                      )}
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

        {!isLoading && filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-xl border-dashed border-border/80 bg-muted/10 my-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <GitFork className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">No departments found</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {selectedBranchFilter !== 'ALL'
                ? `No departments have been configured for ${branchMap.get(selectedBranchFilter) || 'this branch'} yet.`
                : 'No functional departments match your current filter criteria.'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              {selectedBranchFilter !== 'ALL' && !isBranchAdmin && (
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setSelectedBranchFilter('ALL')}>
                  <X className="h-3.5 w-3.5" /> Show All Branches
                </Button>
              )}
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add Department {selectedBranchFilter !== 'ALL' ? `for ${branchMap.get(selectedBranchFilter) || 'Branch'}` : ''}
              </Button>
            </div>
          </div>
        )}

        {!isLoading && filteredDepartments.length > 0 && displayMode === 'grid' && (
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

              const finalCount = employeesData?.items?.filter((emp: any) => {
                if (emp.departmentId !== dept.id) return false;
                const effectiveBranch = isBranchAdmin && assignedBranchId ? assignedBranchId : selectedBranchFilter;
                if (effectiveBranch && effectiveBranch !== 'ALL') {
                  return emp.branchId === effectiveBranch;
                }
                return true;
              }).length ?? 0;
              const capacity = dept.headcountCapacity ?? 10;
              const percentage = capacity > 0 ? Math.round((finalCount / capacity) * 100) : 0;

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
                      {(() => {
                        const deptBranchName = dept.branch?.name || (dept.branchId ? branchMap.get(dept.branchId) : null) || 'All Branches';
                        return (
                          <span className="flex items-center gap-1 font-medium text-foreground/85 truncate max-w-[150px]" title={deptBranchName}>
                            <GitFork className="h-3 w-3 text-primary shrink-0" /> {deptBranchName}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-1.5">
                        {dept.costCenter && (
                          <Badge variant="outline" className="font-mono text-[9px] text-muted-foreground border-border/80">
                            CC: {dept.costCenter}
                          </Badge>
                        )}
                        <Badge variant="outline" className="font-mono text-[9.5px] font-semibold bg-muted/30">
                          Budget: {formatIndianBudget(dept.annualBudget) ?? meta.budget}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredDepartments.length > 0 && displayMode === 'table' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Dept Code</TableHead>
                <TableHead className="text-xs">Department Name</TableHead>
                <TableHead className="text-xs">Branch Location</TableHead>
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
                const finalCount = employeesData?.items?.filter(
                  (emp: any) => emp.departmentId === dept.id
                ).length ?? 0;
                const capacity = dept.headcountCapacity ?? 10;
                const deptBranchName = dept.branch?.name || (dept.branchId ? branchMap.get(dept.branchId) : null) || 'All Branches';

                return (
                  <TableRow key={dept.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{dept.code}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{dept.name}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] font-medium border-border/80 bg-muted/20 gap-1">
                        <GitFork className="h-3 w-3 text-primary inline" />
                        {deptBranchName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline" className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary">
                        {dept.type ?? 'Functional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{dept.manager ?? meta.head}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">{dept.parentDepartment?.name ?? 'None'}</TableCell>
                    <TableCell className="text-xs font-mono">{dept.costCenter ?? '—'}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{finalCount} / {capacity} Staff</TableCell>
                    <TableCell className="text-xs font-mono">{formatIndianBudget(dept.annualBudget) ?? meta.budget}</TableCell>
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
