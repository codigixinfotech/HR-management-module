import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle2, Plus } from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const assetSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  value: z.string().optional(),
});
type AssetFormValues = z.infer<typeof assetSchema>;

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  IN_STOCK: 'secondary',
  ALLOCATED: 'success',
  UNDER_MAINTENANCE: 'warning',
  RETIRED: 'destructive',
};

export function AssetsTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
    enabled: !!companyId,
  });

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: { assetTag: '', name: '', category: '', value: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: AssetFormValues) =>
      assetsApi.create({ ...values, companyId, value: values.value ? Number(values.value) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset registered');
      setOpen(false);
      form.reset({ assetTag: '', name: '', category: '', value: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Corporate Asset Directory</CardTitle>
          <CardDescription>Comprehensive log of laptops, workstations, mobile devices & peripherals</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!companyId}>
              <Plus className="mr-1.5 h-4 w-4" /> Register Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Asset</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Asset Tag</Label>
                  <Input {...form.register('assetTag')} placeholder="AST-0003" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input {...form.register('category')} placeholder="Laptop" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input {...form.register('name')} placeholder="MacBook Pro M3" />
              </div>
              <div className="space-y-1.5">
                <Label>Value (₹)</Label>
                <Input type="number" step="0.01" {...form.register('value')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Register asset
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
              <TableHead className="text-xs">Asset Tag</TableHead>
              <TableHead className="text-xs">Device Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Assigned Employee</TableHead>
              <TableHead className="text-xs">Value</TableHead>
              <TableHead className="text-xs">Status</TableHead>
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
            {assets?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs font-semibold">{a.assetTag}</TableCell>
                <TableCell className="text-xs font-medium">{a.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.category}</TableCell>
                <TableCell className="text-xs">
                  {a.currentEmployee ? `${a.currentEmployee.firstName} ${a.currentEmployee.lastName}` : 'Unassigned'}
                </TableCell>
                <TableCell className="text-xs font-mono">{a.value ? `₹${a.value.toLocaleString('en-IN')}` : '-'}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={STATUS_VARIANT[a.status] ?? 'secondary'} className="text-[10px]">
                    {a.status === 'ALLOCATED' && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {a.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {assets && assets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  No assets registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
