import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle, Landmark, Play, Plus } from 'lucide-react';
import { payrollRunsApi } from '@/api/payroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const runSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  year: z.string().min(1, 'Year is required'),
});
type RunFormValues = z.infer<typeof runSchema>;

export function PayrollProcessingTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const now = new Date();

  const { data: runs, isLoading } = useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: () => payrollRunsApi.list(companyId),
    enabled: !!companyId,
  });

  const form = useForm<RunFormValues>({
    resolver: zodResolver(runSchema),
    defaultValues: { month: String(now.getMonth() + 1), year: String(now.getFullYear()) },
  });

  const createMutation = useMutation({
    mutationFn: (values: RunFormValues) =>
      payrollRunsApi.create({ companyId: companyId!, month: Number(values.month), year: Number(values.year) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success('Payroll run created');
      setOpen(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => payrollRunsApi.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      toast.success('Payroll processed - payslips generated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'PAID' }) => payrollRunsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      toast.success('Run status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Payroll Runs</CardTitle>
          <CardDescription>Create a monthly run, process it to generate payslips, then approve & mark paid</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!companyId}>
              <Plus className="mr-1.5 h-4 w-4" /> New Run
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Payroll Run</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Month</Label>
                  <Input type="number" min={1} max={12} {...form.register('month')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input type="number" {...form.register('year')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create run
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
              <TableHead className="text-xs">Period</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Payslips</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {runs?.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="text-xs font-medium">
                  {MONTH_NAMES[run.month - 1]} {run.year}
                </TableCell>
                <TableCell className="text-xs">
                  <StatusBadge status={run.status} className="text-[10px]" />
                </TableCell>
                <TableCell className="text-xs">{run._count?.payslips ?? 0}</TableCell>
                <TableCell className="text-right">
                  {run.status === 'DRAFT' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => processMutation.mutate(run.id)} disabled={processMutation.isPending}>
                      <Play className="mr-1 h-3 w-3" /> Process
                    </Button>
                  )}
                  {run.status === 'PROCESSED' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: run.id, status: 'APPROVED' })}>
                      <CheckCircle className="mr-1 h-3 w-3" /> Approve
                    </Button>
                  )}
                  {run.status === 'APPROVED' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: run.id, status: 'PAID' })}>
                      <Landmark className="mr-1 h-3 w-3" /> Mark Paid
                    </Button>
                  )}
                  {run.status === 'PAID' && <StatusBadge status="PAID" label="Complete" className="text-[10px]" />}
                </TableCell>
              </TableRow>
            ))}
            {runs && runs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  No payroll runs yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
