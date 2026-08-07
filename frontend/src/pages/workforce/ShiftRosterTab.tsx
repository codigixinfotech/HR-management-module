import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { shiftAssignmentsApi, shiftTypesApi } from '@/api/workforce';
import { employeesApi } from '@/api/employees';
import type { Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const assignmentSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  shiftTypeId: z.string().min(1, 'Shift type is required'),
  effectiveFrom: z.string().min(1, 'Effective from is required'),
  effectiveTo: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export function ShiftRosterTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['shift-assignments'],
    queryFn: () => shiftAssignmentsApi.list(),
  });

  const { data: shiftTypes } = useQuery({
    queryKey: ['shift-types', companyId],
    queryFn: () => shiftTypesApi.list(companyId),
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'roster-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
  });

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { companyId: companyId ?? companies[0]?.id ?? '', employeeId: '', shiftTypeId: '', effectiveFrom: '', effectiveTo: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: AssignmentFormValues) =>
      shiftAssignmentsApi.create({ ...values, effectiveTo: values.effectiveTo || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] });
      toast.success('Shift assignment created');
      setOpen(false);
      form.reset({ companyId: companyId ?? companies[0]?.id ?? '', employeeId: '', shiftTypeId: '', effectiveFrom: '', effectiveTo: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shiftAssignmentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] });
      toast.success('Shift assignment removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Shift Roster</CardTitle>
          <CardDescription>Employee-to-shift assignments and their effective date ranges</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={companies.length === 0}>
              <Plus className="mr-1.5 h-4 w-4" /> Assign Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Shift</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Select value={form.watch('employeeId')} onValueChange={(v) => form.setValue('employeeId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesPage?.items.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Shift Type</Label>
                <Select value={form.watch('shiftTypeId')} onValueChange={(v) => form.setValue('shiftTypeId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift type" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftTypes?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.startTime}-{s.endTime})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Effective From</Label>
                  <Input type="date" {...form.register('effectiveFrom')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Effective To</Label>
                  <Input type="date" {...form.register('effectiveTo')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Assign shift
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
              <TableHead className="text-xs">Employee</TableHead>
              <TableHead className="text-xs">Shift</TableHead>
              <TableHead className="text-xs">Effective From</TableHead>
              <TableHead className="text-xs">Effective To</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {assignments?.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="text-xs font-medium">
                  {assignment.employee ? `${assignment.employee.firstName} ${assignment.employee.lastName}` : '-'}
                </TableCell>
                <TableCell className="text-xs">{assignment.shiftType?.name ?? '-'}</TableCell>
                <TableCell className="text-xs">{new Date(assignment.effectiveFrom).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{assignment.effectiveTo ? new Date(assignment.effectiveTo).toLocaleDateString() : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(assignment.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {assignments && assignments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  No shift assignments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
