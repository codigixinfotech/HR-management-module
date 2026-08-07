import { useQuery } from '@tanstack/react-query';
import { assetsApi } from '@/api/asset-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AssetReportsTab({ companyId }: { companyId?: string }) {
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => assetsApi.list(companyId),
    enabled: !!companyId,
  });

  const categories = Array.from(new Set((assets ?? []).map((a) => a.category)));
  const rows = categories.map((category) => {
    const categoryAssets = (assets ?? []).filter((a) => a.category === category);
    return {
      category,
      count: categoryAssets.length,
      allocated: categoryAssets.filter((a) => a.status === 'ALLOCATED').length,
      inStock: categoryAssets.filter((a) => a.status === 'IN_STOCK').length,
      value: categoryAssets.reduce((sum, a) => sum + (a.value ?? 0), 0),
    };
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Asset Register by Category</CardTitle>
        <CardDescription>Count, allocation status and value breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Total</TableHead>
              <TableHead className="text-xs">Allocated</TableHead>
              <TableHead className="text-xs">In Stock</TableHead>
              <TableHead className="text-xs">Total Value</TableHead>
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
            {!isLoading &&
              rows.map((r) => (
                <TableRow key={r.category}>
                  <TableCell className="text-xs font-medium">{r.category}</TableCell>
                  <TableCell className="text-xs">{r.count}</TableCell>
                  <TableCell className="text-xs text-success">{r.allocated}</TableCell>
                  <TableCell className="text-xs">{r.inStock}</TableCell>
                  <TableCell className="text-xs font-mono">₹{r.value.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
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
