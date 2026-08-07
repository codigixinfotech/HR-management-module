import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { safetyAuditsApi } from '@/api/ehs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const auditSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  auditDate: z.string().min(1, 'Date is required'),
  score: z.string().min(1, 'Score is required'),
  auditor: z.string().min(1, 'Auditor is required'),
  findings: z.string().optional(),
});
type AuditFormValues = z.infer<typeof auditSchema>;

export function SafetyAuditsTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: audits, isLoading } = useQuery({
    queryKey: ['safety-audits', companyId],
    queryFn: () => safetyAuditsApi.list(companyId),
    enabled: !!companyId,
  });

  const form = useForm<AuditFormValues>({
    resolver: zodResolver(auditSchema),
    defaultValues: { location: '', auditDate: new Date().toISOString().slice(0, 10), score: '', auditor: '', findings: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: AuditFormValues) => safetyAuditsApi.create({ ...values, companyId, score: Number(values.score) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-audits'] });
      toast.success('Safety audit recorded');
      setOpen(false);
      form.reset({ location: '', auditDate: new Date().toISOString().slice(0, 10), score: '', auditor: '', findings: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Safety Audits</CardTitle>
          <CardDescription>Periodic workplace safety audit scores and findings</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!companyId}>
              <Plus className="mr-1.5 h-4 w-4" /> New Audit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Safety Audit</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input {...form.register('location')} placeholder="Pune Plant" />
                </div>
                <div className="space-y-1.5">
                  <Label>Audit Date</Label>
                  <Input type="date" {...form.register('auditDate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Score (0-100)</Label>
                  <Input type="number" min={0} max={100} {...form.register('score')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Auditor</Label>
                  <Input {...form.register('auditor')} placeholder="Internal Safety Committee" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Findings</Label>
                <Input {...form.register('findings')} placeholder="Summary of findings" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Record audit
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
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Score</TableHead>
              <TableHead className="text-xs">Auditor</TableHead>
              <TableHead className="text-xs">Findings</TableHead>
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
            {audits?.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs font-medium">{a.location}</TableCell>
                <TableCell className="text-xs font-mono">{new Date(a.auditDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={a.score >= 90 ? 'success' : a.score >= 70 ? 'warning' : 'destructive'} className="text-[10px]">
                    {a.score}%
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{a.auditor}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{a.findings ?? '-'}</TableCell>
              </TableRow>
            ))}
            {audits && audits.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  No audits recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
