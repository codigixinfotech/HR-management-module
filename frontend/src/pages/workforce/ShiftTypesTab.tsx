import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { shiftTypesApi } from '@/api/workforce';
import type { Company, ShiftType } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const shiftTypeSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  breakMinutes: z.number().min(0),
  isNightShift: z.boolean().optional(),
});

type ShiftTypeFormValues = z.infer<typeof shiftTypeSchema>;

const emptyValues = (companyId: string): ShiftTypeFormValues => ({
  companyId,
  code: '',
  name: '',
  startTime: '09:00',
  endTime: '18:00',
  breakMinutes: 60,
  isNightShift: false,
});

export function ShiftTypesTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftType | null>(null);

  const { data: shiftTypes, isLoading } = useQuery({
    queryKey: ['shift-types', companyId],
    queryFn: () => shiftTypesApi.list(companyId),
  });

  const form = useForm<ShiftTypeFormValues>({
    resolver: zodResolver(shiftTypeSchema),
    defaultValues: emptyValues(companyId ?? companies[0]?.id ?? ''),
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: ShiftTypeFormValues) =>
      editing ? shiftTypesApi.update(editing.id, values) : shiftTypesApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-types'] });
      toast.success(editing ? 'Shift type updated' : 'Shift type created');
      setOpen(false);
      setEditing(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftTypesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-types'] });
      toast.success('Shift type deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(emptyValues(companyId ?? companies[0]?.id ?? ''));
    setOpen(true);
  };

  const openEdit = (shiftType: ShiftType) => {
    setEditing(shiftType);
    form.reset({
      companyId: shiftType.companyId,
      code: shiftType.code,
      name: shiftType.name,
      startTime: shiftType.startTime,
      endTime: shiftType.endTime,
      breakMinutes: shiftType.breakMinutes,
      isNightShift: shiftType.isNightShift,
    });
    setOpen(true);
  };

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Shift Types</CardTitle>
          <CardDescription>Configure shift timings, break durations and night-shift designations</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} disabled={companies.length === 0}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Shift Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Shift Type' : 'Add Shift Type'}</DialogTitle>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input {...form.register('code')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...form.register('name')} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" {...form.register('startTime')} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input type="time" {...form.register('endTime')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Break (mins)</Label>
                  <Input type="number" min={0} {...form.register('breakMinutes', { valueAsNumber: true })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register('isNightShift')} className="h-4 w-4" />
                Night shift
              </label>
              <DialogFooter>
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {editing ? 'Save changes' : 'Create shift type'}
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
              <TableHead className="text-xs">Timing</TableHead>
              <TableHead className="text-xs">Break</TableHead>
              <TableHead className="text-xs">Type</TableHead>
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
            {shiftTypes?.map((shiftType) => (
              <TableRow key={shiftType.id}>
                <TableCell className="font-mono text-xs font-semibold">{shiftType.code}</TableCell>
                <TableCell className="text-xs font-medium">{shiftType.name}</TableCell>
                <TableCell className="text-xs">
                  {shiftType.startTime} - {shiftType.endTime}
                </TableCell>
                <TableCell className="text-xs">{shiftType.breakMinutes}m</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={shiftType.isNightShift ? 'warning' : 'secondary'} className="text-[10px]">
                    {shiftType.isNightShift ? 'Night' : 'Day'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(shiftType)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(shiftType.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {shiftTypes && shiftTypes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  No shift types yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
