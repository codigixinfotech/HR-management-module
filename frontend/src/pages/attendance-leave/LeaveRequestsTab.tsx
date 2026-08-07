import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Check, X } from 'lucide-react';
import { leaveRequestsApi, leaveTypesApi } from '@/api/attendance-leave';
import { employeesApi } from '@/api/employees';
import type { Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const leaveRequestSchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
});

type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

export function LeaveRequestsTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests', page],
    queryFn: () => leaveRequestsApi.list({ page, pageSize: 20 }),
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types', companyId],
    queryFn: () => leaveTypesApi.list(companyId),
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'leave-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
  });

  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { companyId: companyId ?? companies[0]?.id ?? '', employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: LeaveRequestFormValues) => leaveRequestsApi.create({ ...values, reason: values.reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request submitted');
      setOpen(false);
      form.reset({ companyId: companyId ?? companies[0]?.id ?? '', employeeId: '', leaveTypeId: '', startDate: '', endDate: '', reason: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      leaveRequestsApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success('Leave request updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Leave Requests</CardTitle>
          <CardDescription>Submitted leave applications awaiting review, approved, or rejected</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={companies.length === 0}>
              <Plus className="mr-1.5 h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Leave Request</DialogTitle>
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
                <Label>Leave Type</Label>
                <Select value={form.watch('leaveTypeId')} onValueChange={(v) => form.setValue('leaveTypeId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes?.map((lt) => (
                      <SelectItem key={lt.id} value={lt.id}>
                        {lt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" {...form.register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" {...form.register('endDate')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input {...form.register('reason')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Submit request
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
              <TableHead className="text-xs">Leave Type</TableHead>
              <TableHead className="text-xs">Dates</TableHead>
              <TableHead className="text-xs">Days</TableHead>
              <TableHead className="text-xs">Status</TableHead>
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
            {data?.items.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="text-xs font-medium">
                  {request.employee ? `${request.employee.firstName} ${request.employee.lastName}` : '-'}
                </TableCell>
                <TableCell className="text-xs">{request.leaveType?.name ?? '-'}</TableCell>
                <TableCell className="text-xs">
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-xs">{request.totalDays}</TableCell>
                <TableCell className="text-xs">
                  <StatusBadge status={request.status} className="text-[10px]" />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {request.status === 'PENDING' && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => statusMutation.mutate({ id: request.id, status: 'APPROVED' })}
                      >
                        <Check className="h-3.5 w-3.5 text-success" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => statusMutation.mutate({ id: request.id, status: 'REJECTED' })}
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {data && data.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  No leave requests yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {data && data.total > data.pageSize && (
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {data.page} of {Math.ceil(data.total / data.pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(data.total / data.pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
