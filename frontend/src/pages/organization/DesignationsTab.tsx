import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Award, Search, Briefcase } from 'lucide-react';
import { departmentsApi, designationsApi } from '@/api/organization';
import type { Company, Designation } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const designationSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  departmentId: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  title: z.string().min(1, 'Title is required'),
  grade: z.string().optional(),
});

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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: designations, isLoading } = useQuery({
    queryKey: ['designations', companyId],
    queryFn: () => designationsApi.list(companyId),
  });

  const form = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: { companyId: companyId ?? companies[0]?.id ?? '', departmentId: '', code: '', title: '', grade: 'E2' },
  });

  const selectedCompanyId = form.watch('companyId');
  const { data: departmentOptions } = useQuery({
    queryKey: ['departments', selectedCompanyId],
    queryFn: () => departmentsApi.list(selectedCompanyId),
    enabled: !!selectedCompanyId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: DesignationFormValues) => {
      const payload = { ...values, departmentId: values.departmentId || undefined };
      return editing ? designationsApi.update(editing.id, payload) : designationsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designations'] });
      toast.success(editing ? 'Designation updated' : 'Designation created');
      setOpen(false);
      setEditing(null);
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
    form.reset({ companyId: companyId ?? companies[0]?.id ?? '', departmentId: '', code: '', title: '', grade: 'E2' });
    setOpen(true);
  };

  const openEdit = (designation: Designation) => {
    setEditing(designation);
    form.reset({
      companyId: designation.companyId,
      departmentId: designation.departmentId ?? '',
      code: designation.code,
      title: designation.title,
      grade: designation.grade ?? 'E2',
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
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit Job Designation' : 'Create New Designation'}</DialogTitle>
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
                    <Label className="text-xs">Mapped Department (Optional)</Label>
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
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Code</Label>
                      <Input placeholder="e.g. DESG-101" {...form.register('code')} className="h-9 text-xs font-mono" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs">Job Designation Title</Label>
                      <Input placeholder="e.g. Senior Software Engineer" {...form.register('title')} className="h-9 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pay Grade Level Band</Label>
                    <Select value={form.watch('grade')} onValueChange={(v) => form.setValue('grade', v)}>
                      <SelectTrigger className="h-9 text-xs font-mono">
                        <SelectValue placeholder="Select grade band" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E1" className="text-xs font-mono">E1 - Junior Executive</SelectItem>
                        <SelectItem value="E2" className="text-xs font-mono">E2 - Software Engineer / Analyst</SelectItem>
                        <SelectItem value="E3" className="text-xs font-mono">E3 - Senior Engineer / Specialist</SelectItem>
                        <SelectItem value="M1" className="text-xs font-mono">M1 - Team Lead / Manager</SelectItem>
                        <SelectItem value="M2" className="text-xs font-mono">M2 - Senior Manager / Head</SelectItem>
                        <SelectItem value="L1" className="text-xs font-mono">L1 - Director / VP</SelectItem>
                        <SelectItem value="L2" className="text-xs font-mono">L2 - CXO Leadership</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" size="sm" className="text-xs" disabled={upsertMutation.isPending}>
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
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
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
                  <TableCell className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {designation.title}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {designation.department?.name ?? 'General Corporate'}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge className={`text-[10px] font-mono font-semibold ${gradeMeta.badge}`}>
                      Grade {gradeCode} ({gradeMeta.label})
                    </Badge>
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
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
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
