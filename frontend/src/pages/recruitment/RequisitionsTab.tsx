import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Grid,
  List,
  Briefcase,
  Users,
} from 'lucide-react';
import { jobOpeningsApi } from '@/api/recruitment';
import { companiesApi } from '@/api/organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

const jobOpeningSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  title: z.string().min(1, 'Title is required'),
  numPositions: z.number().min(1, 'At least 1 position is required'),
  description: z.string().optional(),
});

type JobOpeningFormValues = z.infer<typeof jobOpeningSchema>;

const PRIORITY_MAP: Record<string, { label: string; badge: string }> = {
  'High': { label: 'High Priority', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  'Medium': { label: 'Medium Priority', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  'Low': { label: 'Low Priority', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
};

export function RequisitionsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const { data: companies } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });
  const { data: openings, isLoading } = useQuery({ queryKey: ['job-openings'], queryFn: () => jobOpeningsApi.list() });

  const form = useForm<JobOpeningFormValues>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: { companyId: '', title: '', numPositions: 1, description: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: JobOpeningFormValues) => jobOpeningsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-openings'] });
      toast.success('Job requisition published');
      setOpen(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const filteredOpenings = useMemo(() => {
    if (!openings) return [];
    return openings.filter(o => {
      const matchesSearch =
        o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.department?.name && o.department.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesDept =
        selectedDept === 'all' ? true : o.department?.name?.toLowerCase() === selectedDept.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [openings, searchQuery, selectedDept]);

  const departmentsList = useMemo(() => {
    if (!openings) return [];
    const depts = new Set<string>();
    openings.forEach(o => {
      if (o.department?.name) depts.add(o.department.name);
    });
    return Array.from(depts);
  }, [openings]);

  return (
    <div className="space-y-6">
      {/* ── 1. Requisitions Filter & Layout Controls ── */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> Active Job Requisitions
              </CardTitle>
              <CardDescription className="text-xs">
                Manage open vacancies, candidate applications, priority status & hiring managers
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setSelectedDept('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedDept === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  All Depts
                </button>
                {departmentsList.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${selectedDept.toLowerCase() === dept.toLowerCase()
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* View Switcher */}
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
              <div className="relative w-40 sm:w-52">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter requisitions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>

              {/* Add Requisition Dialog */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => form.reset({ companyId: companies?.[0]?.id ?? '', title: '', numPositions: 1, description: '' })}>
                    <Plus className="h-3.5 w-3.5" /> Post Requisition
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Job Requisition</DialogTitle>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Entity</Label>
                      <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies?.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Job Title</Label>
                        <Input placeholder="e.g. React Architect" {...form.register('title')} className="h-9 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Positions Approved</Label>
                        <Input type="number" min={1} {...form.register('numPositions', { valueAsNumber: true })} className="h-9 text-xs font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Description & Requirements</Label>
                      <Input placeholder="Key skills & experience required" {...form.register('description')} className="h-9 text-xs" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" size="sm" className="text-xs" disabled={createMutation.isPending}>
                        Publish Requisition
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
              Loading requisitions...
            </div>
          )}

          {!isLoading && displayMode === 'grid' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOpenings.map((opening) => {
                const candidatesCount = opening._count?.candidates ?? 0;
                // Mock priority, salary budget, manager for visuals
                const priorityKey = opening.numPositions >= 5 ? 'High' : opening.numPositions >= 2 ? 'Medium' : 'Low';
                const priorityMeta = PRIORITY_MAP[priorityKey];
                const targetSalary = opening.numPositions >= 5 ? '₹18L - ₹28L / yr' : '₹10L - ₹16L / yr';

                return (
                  <Link key={opening.id} to={`/recruitment/detail/${opening.id}`}>
                    <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
                      <div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`text-[9.5px] font-semibold ${priorityMeta.badge}`}>
                            {priorityMeta.label}
                          </Badge>
                          <StatusBadge
                            status={opening.isActive ? 'ACTIVE' : 'INACTIVE'}
                            label={opening.isActive ? 'Open' : 'Closed'}
                            className="text-[10px]"
                          />
                        </div>

                        <h3 className=" text-base font-semibold text-foreground mt-3 group-hover:text-primary transition-colors line-clamp-1">
                          {opening.title}
                        </h3>
                        <p className="text-xs text-muted-foreground font-semibold mt-1">
                          {opening.department?.name ?? 'General Corporate'}
                        </p>
                      </div>

                      <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                          <div>
                            <span className="text-[9.5px] uppercase font-semibold tracking-wider">Approved Target</span>
                            <p className="font-semibold text-foreground mt-0.5">{opening.numPositions} Headcount</p>
                          </div>
                          <div>
                            <span className="text-[9.5px] uppercase font-semibold tracking-wider">Budget Scale</span>
                            <p className="font-mono text-foreground font-semibold mt-0.5">{targetSalary}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                          <span className="flex items-center gap-1.5 font-semibold text-primary">
                            <Users className="h-3.5 w-3.5" /> {candidatesCount} Candidates
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">ID: {opening.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!isLoading && displayMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Req ID</TableHead>
                  <TableHead className="text-xs">Job Position Title</TableHead>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Target Positions</TableHead>
                  <TableHead className="text-xs">Priority</TableHead>
                  <TableHead className="text-xs">Pipeline Status</TableHead>
                  <TableHead className="text-right text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpenings.map((opening) => {
                  const priorityKey = opening.numPositions >= 5 ? 'High' : opening.numPositions >= 2 ? 'Medium' : 'Low';
                  const priorityMeta = PRIORITY_MAP[priorityKey];

                  return (
                    <TableRow key={opening.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-primary uppercase">{opening.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground hover:text-primary">
                        <Link to={`/recruitment/detail/${opening.id}`} className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          {opening.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{opening.department?.name ?? 'General'}</TableCell>
                      <TableCell className="text-xs font-mono font-semibold">{opening.numPositions} Approved</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={`text-[10px] font-semibold ${priorityMeta.badge}`}>
                          {priorityKey}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono font-semibold text-primary">
                        {opening._count?.candidates ?? 0} Sourced
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge
                          status={opening.isActive ? 'ACTIVE' : 'INACTIVE'}
                          label={opening.isActive ? 'Open' : 'Closed'}
                          className="text-[10px]"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
