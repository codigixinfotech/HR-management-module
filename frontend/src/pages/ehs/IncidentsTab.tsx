import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { incidentsApi } from '@/api/ehs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const incidentSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  incidentType: z.string().min(1, 'Incident type is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  occurredAt: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
});
type IncidentFormValues = z.infer<typeof incidentSchema>;

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  LOW: 'secondary',
  MEDIUM: 'warning',
  HIGH: 'destructive',
  CRITICAL: 'destructive',
};

export function IncidentsTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['safety-incidents', companyId],
    queryFn: () => incidentsApi.list(companyId),
    enabled: !!companyId,
  });

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { location: '', incidentType: '', severity: 'LOW', occurredAt: new Date().toISOString().slice(0, 10), description: '' },
  });

  const createMutation = useMutation({
    mutationFn: (values: IncidentFormValues) => incidentsApi.create({ ...values, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      toast.success('Incident reported');
      setOpen(false);
      form.reset({ location: '', incidentType: '', severity: 'LOW', occurredAt: new Date().toISOString().slice(0, 10), description: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' }) =>
      incidentsApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      toast.success('Incident status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Incident & Hazard Log</CardTitle>
          <CardDescription>Track workplace safety incidents, near-misses and corrective actions</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={!companyId}>
              <Plus className="mr-1.5 h-4 w-4" /> Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Safety Incident</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input {...form.register('location')} placeholder="Assembly Line 2" />
                </div>
                <div className="space-y-1.5">
                  <Label>Incident Type</Label>
                  <Input {...form.register('incidentType')} placeholder="Minor first aid" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Severity</Label>
                  <Select value={form.watch('severity')} onValueChange={(v) => form.setValue('severity', v as IncidentFormValues['severity'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" {...form.register('occurredAt')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input {...form.register('description')} placeholder="What happened" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Submit report
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
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Severity</TableHead>
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
            {incidents?.map((inc) => (
              <TableRow key={inc.id}>
                <TableCell className="text-xs font-medium">{inc.location}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{inc.incidentType}</TableCell>
                <TableCell className="text-xs font-mono">{new Date(inc.occurredAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={SEVERITY_VARIANT[inc.severity]} className="text-[10px]">
                    {inc.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <StatusBadge status={inc.status} className="text-[10px]" />
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {inc.status === 'OPEN' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: inc.id, status: 'IN_PROGRESS' })}>
                      Start
                    </Button>
                  )}
                  {(inc.status === 'OPEN' || inc.status === 'IN_PROGRESS') && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: inc.id, status: 'RESOLVED' })}>
                      Resolve
                    </Button>
                  )}
                  {inc.status === 'RESOLVED' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: inc.id, status: 'CLOSED' })}>
                      Close
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {incidents && incidents.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                  No incidents reported. Great safety record!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
