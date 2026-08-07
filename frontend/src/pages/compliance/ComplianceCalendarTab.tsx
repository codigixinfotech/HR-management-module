import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import { complianceTasksApi, complianceTypesApi } from '@/api/compliance';
import type { ComplianceTask } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const taskSchema = z.object({
  complianceTypeId: z.string().min(1, 'Compliance type is required'),
  periodLabel: z.string().min(1, 'Period is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});
type TaskFormValues = z.infer<typeof taskSchema>;

function isOverdue(task: ComplianceTask) {
  return (task.status === 'PENDING' || task.status === 'IN_PROGRESS') && new Date(task.dueDate) < new Date();
}

export function ComplianceCalendarTab({
  companyId,
  title,
  description,
  filter,
}: {
  companyId?: string;
  title: string;
  description: string;
  filter?: (task: ComplianceTask) => boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: types } = useQuery({
    queryKey: ['compliance-types', companyId],
    queryFn: () => complianceTypesApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: tasksPage, isLoading } = useQuery({
    queryKey: ['compliance-tasks', companyId],
    queryFn: () => complianceTasksApi.list({ companyId, pageSize: 100 }),
    enabled: !!companyId,
  });

  const tasks = (tasksPage?.items ?? []).filter((t) => (filter ? filter(t) : true));
  const filteredTasks = tasks.filter(t =>
    t.complianceType?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.periodLabel?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { complianceTypeId: '', periodLabel: '', dueDate: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: TaskFormValues) => complianceTasksApi.create({ companyId: companyId!, ...values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      toast.success('Compliance task created');
      setOpen(false);
      form.reset({ complianceTypeId: '', periodLabel: '', dueDate: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'IN_PROGRESS' | 'FILED' | 'WAIVED' }) =>
      complianceTasksApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-tasks'] });
      toast.success('Task status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="pb-3 border-b border-border/60 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-40 sm:w-52">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8.5 pl-8 text-xs bg-background"
            />
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8.5 text-xs gap-1.5" disabled={!companyId}>
                <Plus className="h-3.5 w-3.5" /> New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Compliance Task</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                <div className="space-y-1.5">
                  <Label>Compliance Type</Label>
                  <Select value={form.watch('complianceTypeId')} onValueChange={(v) => form.setValue('complianceTypeId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Period</Label>
                    <Input {...form.register('periodLabel')} placeholder="e.g. Jul-2026" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Due Date</Label>
                    <Input type="date" {...form.register('dueDate')} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Create task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Compliance</TableHead>
              <TableHead className="text-xs">Period</TableHead>
              <TableHead className="text-xs">Due Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
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
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task);
              const displayStatus = overdue ? 'OVERDUE' : task.status;
              return (
                <TableRow key={task.id}>
                  <TableCell className="text-xs font-medium">
                    {task.complianceType?.name}
                    <span className="block text-[10px] text-muted-foreground">{task.complianceType?.category}</span>
                  </TableCell>
                  <TableCell className="text-xs">{task.periodLabel}</TableCell>
                  <TableCell className="text-xs font-mono">{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">
                    <StatusBadge status={displayStatus} className="text-[10px]" />
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {(task.status === 'PENDING' || task.status === 'IN_PROGRESS') && (
                      <>
                        {task.status === 'PENDING' && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => statusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })}>
                            Start
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => statusMutation.mutate({ id: task.id, status: 'FILED' })}>
                          Mark Filed
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredTasks.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  No compliance tasks in this category yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
