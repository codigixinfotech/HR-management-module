import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { leaveTypesApi } from '@/api/attendance-leave';
import type { Company, LeaveType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const leaveTypeSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  annualQuota: z.number().min(0),
  isPaid: z.boolean().optional(),
  carryForward: z.boolean().optional(),
});

type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;

const emptyValues = (companyId: string): LeaveTypeFormValues => ({
  companyId,
  code: '',
  name: '',
  annualQuota: 0,
  isPaid: true,
  carryForward: false,
});

export function LeaveTypesTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);

  const { data: leaveTypes, isLoading } = useQuery({
    queryKey: ['leave-types', companyId],
    queryFn: () => leaveTypesApi.list(companyId),
  });

  const form = useForm<LeaveTypeFormValues>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: emptyValues(companyId ?? companies[0]?.id ?? ''),
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: LeaveTypeFormValues) =>
      editing ? leaveTypesApi.update(editing.id, values) : leaveTypesApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success(editing ? 'Leave type updated' : 'Leave type created');
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leaveTypesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyValues(companyId ?? companies[0]?.id ?? ''));
    setOpen(true);
  };

  const openEdit = (leaveType: LeaveType) => {
    setEditing(leaveType);
    form.reset({
      companyId: leaveType.companyId,
      code: leaveType.code,
      name: leaveType.name,
      annualQuota: leaveType.annualQuota,
      isPaid: leaveType.isPaid,
      carryForward: leaveType.carryForward,
    });
    setOpen(true);
  };

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Leave Types</CardTitle>
          <CardDescription>Configured leave categories, annual quotas and carry-forward rules</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} disabled={companies.length === 0}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Select value={form.watch('companyId')} onValueChange={(v) => form.setValue('companyId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input {...form.register('code')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...form.register('name')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Annual Quota</Label>
                  <Input type="number" min={0} {...form.register('annualQuota', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register('isPaid')} className="h-4 w-4" />
                  Paid leave
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register('carryForward')} className="h-4 w-4" />
                  Carry forward
                </label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {editing ? 'Save changes' : 'Create leave type'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Annual Quota</TableHead>
              <TableHead className="text-xs">Paid</TableHead>
              <TableHead className="text-xs">Carry Forward</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {leaveTypes?.map((leaveType) => (
              <TableRow key={leaveType.id}>
                <TableCell className="font-mono text-xs font-semibold">{leaveType.code}</TableCell>
                <TableCell className="text-xs font-medium">{leaveType.name}</TableCell>
                <TableCell className="text-xs">{leaveType.annualQuota}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={leaveType.isPaid ? 'success' : 'secondary'} className="text-[10px]">
                    {leaveType.isPaid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{leaveType.carryForward ? 'Yes' : 'No'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(leaveType)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(leaveType.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {leaveTypes && leaveTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  No leave types yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
