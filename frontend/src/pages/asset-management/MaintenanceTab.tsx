import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { assetMaintenanceApi, assetsApi } from '@/api/asset-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const maintenanceSchema = z.object({
  assetId: z.string().min(1, 'Asset is required'),
  issue: z.string().min(1, 'Issue is required'),
  startDate: z.string().min(1, 'Start date is required'),
  cost: z.string().optional(),
});
type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

export function MaintenanceTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: assets } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ['asset-maintenance'],
    queryFn: () => assetMaintenanceApi.list(),
  });

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { assetId: '', issue: '', startDate: new Date().toISOString().slice(0, 10), cost: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: MaintenanceFormValues) =>
      assetMaintenanceApi.create({ ...values, cost: values.cost ? Number(values.cost) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset sent to maintenance');
      setOpen(false);
      form.reset({ assetId: '', issue: '', startDate: new Date().toISOString().slice(0, 10), cost: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => assetMaintenanceApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Maintenance completed - asset back in stock');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const eligibleAssets = assets?.filter((a) => a.status === 'IN_STOCK' || a.status === 'ALLOCATED') ?? [];

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Maintenance Log</CardTitle>
          <CardDescription>Devices under repair or warranty claims</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Send to Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Asset to Maintenance</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="space-y-1.5">
                <Label>Asset</Label>
                <Select value={form.watch('assetId')} onValueChange={(v) => form.setValue('assetId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleAssets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.assetTag} - {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Issue</Label>
                <Input {...form.register('issue')} placeholder="Battery replacement under warranty" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" {...form.register('startDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cost (₹)</Label>
                  <Input type="number" step="0.01" {...form.register('cost')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Submit
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
              <TableHead className="text-xs">Asset</TableHead>
              <TableHead className="text-xs">Issue</TableHead>
              <TableHead className="text-xs">Start Date</TableHead>
              <TableHead className="text-xs">Cost</TableHead>
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
            {records?.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">
                  {r.asset?.assetTag} - {r.asset?.name}
                </TableCell>
                <TableCell className="text-xs">{r.issue}</TableCell>
                <TableCell className="text-xs font-mono">{new Date(r.startDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{r.cost ? `₹${r.cost.toLocaleString('en-IN')}` : '-'}</TableCell>
                <TableCell className="text-xs">
                  <StatusBadge status={r.endDate ? 'COMPLETED' : 'IN_PROGRESS'} className="text-[10px]" />
                </TableCell>
                <TableCell className="text-right">
                  {!r.endDate && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => completeMutation.mutate(r.id)}>
                      Mark Complete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {records && records.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  No maintenance records yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
