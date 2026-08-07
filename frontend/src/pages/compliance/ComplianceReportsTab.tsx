import { useQuery } from '@tanstack/react-query';
import { complianceTasksApi } from '@/api/compliance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function ComplianceReportsTab({ companyId }: { companyId?: string }) {
  const { data: tasksPage } = useQuery({
    queryKey: ['compliance-tasks', companyId],
    queryFn: () => complianceTasksApi.list({ companyId, pageSize: 100 }),
    enabled: !!companyId,
  });

  const tasks = tasksPage?.items ?? [];
  const categories = Array.from(new Set(tasks.map((t) => t.complianceType?.category ?? 'UNKNOWN')));

  const rows = categories.map((category) => {
    const categoryTasks = tasks.filter((t) => (t.complianceType?.category ?? 'UNKNOWN') === category);
    return {
      category,
      total: categoryTasks.length,
      filed: categoryTasks.filter((t) => t.status === 'FILED').length,
      pending: categoryTasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
      overdue: categoryTasks.filter((t) => (t.status === 'PENDING' || t.status === 'IN_PROGRESS') && new Date(t.dueDate) < new Date()).length,
    };
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Compliance Status by Category</CardTitle>
        <CardDescription>Filing progress across statutory returns, licenses and audits</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Total Tasks</TableHead>
              <TableHead className="text-xs">Filed</TableHead>
              <TableHead className="text-xs">Pending</TableHead>
              <TableHead className="text-xs">Overdue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.category}>
                <TableCell className="text-xs font-medium">{r.category}</TableCell>
                <TableCell className="text-xs">{r.total}</TableCell>
                <TableCell className="text-xs text-success">{r.filed}</TableCell>
                <TableCell className="text-xs text-warning">{r.pending}</TableCell>
                <TableCell className="text-xs text-destructive">{r.overdue}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  No compliance tasks yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
