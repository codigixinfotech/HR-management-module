import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { assetsApi } from '@/api/asset-management';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ReturnTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
    enabled: !!companyId,
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => assetsApi.returnAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset returned to stock');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const allocatedAssets = assets?.filter((a) => a.status === 'ALLOCATED') ?? [];

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Allocated Devices</CardTitle>
        <CardDescription>Assets currently held by employees, available to process a return</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Asset Tag</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Held By</TableHead>
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
            {allocatedAssets.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs font-semibold">{a.assetTag}</TableCell>
                <TableCell className="text-xs font-medium">{a.name}</TableCell>
                <TableCell className="text-xs">
                  {a.currentEmployee ? `${a.currentEmployee.firstName} ${a.currentEmployee.lastName}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => returnMutation.mutate(a.id)} disabled={returnMutation.isPending}>
                    <Undo2 className="mr-1 h-3 w-3" /> Return
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {allocatedAssets.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  No assets currently allocated.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
