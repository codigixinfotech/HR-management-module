import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserCheck } from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AllocationTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [targetAssetId, setTargetAssetId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'asset-allocation-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
    enabled: !!companyId,
  });

  const allocateMutation = useMutation({
    mutationFn: (id: string) => assetsApi.allocate(id, { employeeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset allocated');
      setTargetAssetId(null);
      setEmployeeId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const availableAssets = assets?.filter((a) => a.status === 'IN_STOCK') ?? [];

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Available Stock</CardTitle>
        <CardDescription>In-stock assets ready to allocate to a new joiner or replacement</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Asset Tag</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
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
            {availableAssets.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs font-semibold">{a.assetTag}</TableCell>
                <TableCell className="text-xs font-medium">{a.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.category}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => setTargetAssetId(a.id)}>
                    <UserCheck className="mr-1 h-3 w-3" /> Allocate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {availableAssets.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  No available stock right now.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={!!targetAssetId} onOpenChange={(v) => !v && setTargetAssetId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Allocate Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Select value={employeeId} onValueChange={setEmployeeId}>
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
              <DialogFooter>
                <Button
                  disabled={!employeeId || allocateMutation.isPending}
                  onClick={() => targetAssetId && allocateMutation.mutate(targetAssetId)}
                >
                  Confirm allocation
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
