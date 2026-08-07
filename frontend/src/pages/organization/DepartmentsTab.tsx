import { useState, useMemo } from 'react';
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
  Search,
  Grid,
  List,
  Building2,
  UserCheck,
} from 'lucide-react';
import { branchesApi, departmentsApi } from '@/api/organization';
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
  branchId: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

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

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { companyId: companyId ?? companies[0]?.id ?? '', branchId: '', code: '', name: '' },
  });

  const selectedCompanyId = form.watch('companyId');
  const { data: branchOptions } = useQuery({
    queryKey: ['branches', selectedCompanyId],
    queryFn: () => branchesApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: DepartmentFormValues) => {
      const payload = { ...values, branchId: values.branchId || undefined };
      return editing ? departmentsApi.update(editing.id, payload) : departmentsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(editing ? 'Department updated' : 'Department created');
      setOpen(false);
      setEditing(null);
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
    form.reset({ companyId: companyId ?? companies[0]?.id ?? '', branchId: '', code: '', name: '' });
    setOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    form.reset({
      companyId: department.companyId,
      branchId: department.branchId ?? '',
      code: department.code,
      name: department.name,
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Department' : 'Create New Department'}</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Entity</Label>
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
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Branch Facility (Optional)</Label>
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Department Code</Label>
                      <Input placeholder="e.g. DEPT-ENG" {...form.register('code')} className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Department Name</Label>
                      <Input placeholder="e.g. Engineering & Tech" {...form.register('name')} className="h-9 text-xs" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs" disabled={upsertMutation.isPending}>
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
              const meta = EXTRA_DEPT_METRICS[dept.code] || {
                head: 'Unassigned Lead',
                count: 14,
                cap: 20,
                budget: '₹2.5 Cr',
                location: 'Main Facility',
                color: 'bg-primary',
              };
              const percentage = Math.round((meta.count / meta.cap) * 100);

              return (
                <div
                  key={dept.id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                        <span className="font-mono text-xs font-semibold text-muted-foreground uppercase">{dept.code}</span>
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
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <UserCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <strong className="text-foreground">{meta.head}</strong>
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                    {/* Headcount Utilization Meter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" /> Headcount Capacity
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {meta.count} / {meta.cap} ({percentage}%)
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
                      <Badge variant="outline" className="font-mono text-[9.5px] font-semibold">
                        Budget: {meta.budget}
                      </Badge>
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
                <TableHead className="text-xs">Department Lead</TableHead>
                <TableHead className="text-xs">Headcount Cap</TableHead>
                <TableHead className="text-xs">Annual Budget</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepartments.map((dept) => {
                const meta = EXTRA_DEPT_METRICS[dept.code] || { head: 'Unassigned', count: 14, cap: 20, budget: '₹2.5 Cr' };
                return (
                  <TableRow key={dept.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{dept.code}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{dept.name}</TableCell>
                    <TableCell className="text-xs">{meta.head}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{meta.count} / {meta.cap} Staff</TableCell>
                    <TableCell className="text-xs font-mono">{meta.budget}</TableCell>
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
