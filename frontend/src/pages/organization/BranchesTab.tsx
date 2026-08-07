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
  GitFork,
  MapPin,
  Users,
  Search,
  Grid,
  List,
} from 'lucide-react';
import { branchesApi } from '@/api/organization';
import type { Branch, Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const branchSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

const EXTRA_BRANCH_METRICS: Record<string, { type: string; manager: string; staff: number; capacity: number; address: string; phone: string; status: string; color: string }> = {
  'BR-NYC': { type: 'Corporate Headquarters', manager: 'Eleanor Vance (CEO)', staff: 120, capacity: 150, address: '350 Fifth Ave, Floor 42, New York, NY 10118', phone: '+1 (212) 555-0192', status: 'Active HQ', color: 'bg-primary' },
  'BR-BOS': { type: 'R&D Technology Hub', manager: 'Marcus Brody (Head of AI)', staff: 64, capacity: 80, address: '100 Technology Square, Cambridge, MA 02139', phone: '+1 (617) 555-0144', status: 'Active Hub', color: 'bg-emerald-500' },
  'BR-CHI': { type: 'Regional Sales Office', manager: 'Michael Chang (VP Sales)', staff: 40, capacity: 50, address: '233 S Wacker Dr, Suite 1800, Chicago, IL 60606', phone: '+1 (312) 555-0188', status: 'Active Office', color: 'bg-amber-500' },
  'BR-PUN': { type: 'Manufacturing & Operations Plant', manager: 'Karan Joshi (Plant Mgr)', staff: 61, capacity: 75, address: 'Plot 42, Chakan Industrial Area, Phase II, Pune 410501', phone: '+91 (2135) 555-0120', status: 'Active Plant', color: 'bg-violet-500' },
};

export function BranchesTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('grid');

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches', companyId],
    queryFn: () => branchesApi.list(companyId),
  });

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { companyId: companyId ?? companies[0]?.id ?? '', code: '', name: '', city: '', state: '', country: '' },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: BranchFormValues) =>
      editing ? branchesApi.update(editing.id, values) : branchesApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success(editing ? 'Branch updated' : 'Branch created');
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Branch deleted');
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ companyId: companyId ?? companies[0]?.id ?? '', code: '', name: '', city: '', state: '', country: '' });
    setOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    form.reset({
      companyId: branch.companyId,
      code: branch.code,
      name: branch.name,
      city: branch.city ?? '',
      state: branch.state ?? '',
      country: branch.country ?? '',
    });
    setOpen(true);
  };

  const filteredBranches = useMemo(() => {
    if (!branches) return [];
    if (!searchQuery.trim()) return branches;
    const q = searchQuery.toLowerCase();
    return branches.filter(b => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || (b.city && b.city.toLowerCase().includes(q)));
  }, [branches, searchQuery]);

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GitFork className="h-4 w-4 text-primary" /> Branch Facilities & Regional Hubs
            </CardTitle>
            <CardDescription className="text-xs">
              Physical office locations, manufacturing plants, registered addresses & facility managers
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
                placeholder="Search branches..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            {/* Add Branch Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate} disabled={companies.length === 0}>
                  <Plus className="h-3.5 w-3.5" /> Add Branch Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Branch Facility' : 'Create New Branch Facility'}</DialogTitle>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Facility Code</Label>
                      <Input placeholder="e.g. BR-NYC" {...form.register('code')} className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Branch Name</Label>
                      <Input placeholder="e.g. New York Headquarters" {...form.register('name')} className="h-9 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">City</Label>
                      <Input placeholder="New York" {...form.register('city')} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State</Label>
                      <Input placeholder="NY" {...form.register('state')} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Country</Label>
                      <Input placeholder="USA" {...form.register('country')} className="h-9 text-xs" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs" disabled={upsertMutation.isPending}>
                      {editing ? 'Save Changes' : 'Create Branch'}
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
            Loading branches...
          </div>
        )}

        {!isLoading && displayMode === 'grid' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {filteredBranches.map((branch) => {
              const meta = EXTRA_BRANCH_METRICS[branch.code] || {
                type: 'Branch Office',
                manager: 'Site Lead',
                staff: 20,
                capacity: 30,
                address: `${branch.city ?? 'Location'}, ${branch.state ?? ''}`,
                phone: '+1 (555) 0100',
                status: 'Active Site',
                color: 'bg-primary',
              };
              const percentage = Math.round((meta.staff / meta.capacity) * 100);

              return (
                <div
                  key={branch.id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                        <span className="font-mono text-xs font-semibold text-primary">{branch.code}</span>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {meta.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(branch)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(branch.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <h3 className=" text-lg font-semibold text-foreground mt-2 group-hover:text-primary transition-colors">
                      {branch.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{meta.address}</span>
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Facility Manager</span>
                        <p className="font-semibold text-foreground truncate">{meta.manager}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">Direct Contact</span>
                        <p className="font-mono text-foreground text-[11px]">{meta.phone}</p>
                      </div>
                    </div>

                    {/* Staff Occupancy Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                          <Users className="h-3 w-3" /> Facility Capacity
                        </span>
                        <span className="font-mono font-semibold text-foreground">
                          {meta.staff} / {meta.capacity} Staff ({percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${meta.color}`} style={{ width: `${percentage}%` }} />
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
                <TableHead className="text-xs">Facility Code</TableHead>
                <TableHead className="text-xs">Branch Name</TableHead>
                <TableHead className="text-xs">Facility Type</TableHead>
                <TableHead className="text-xs">City & State</TableHead>
                <TableHead className="text-xs">Occupancy</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch) => {
                const meta = EXTRA_BRANCH_METRICS[branch.code] || { type: 'Branch', staff: 20, capacity: 30 };
                return (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">{branch.code}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{branch.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{meta.type}</TableCell>
                    <TableCell className="text-xs">{branch.city}, {branch.state}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold">{meta.staff} / {meta.capacity} Staff</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(branch)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(branch.id)}>
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
