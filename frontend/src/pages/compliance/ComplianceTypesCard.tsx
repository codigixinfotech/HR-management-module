import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { complianceTypesApi } from '@/api/compliance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const typeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUALLY', 'ONE_TIME']),
});
type TypeFormValues = z.infer<typeof typeSchema>;

export function ComplianceTypesCard({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: types } = useQuery({
    queryKey: ['compliance-types', companyId],
    queryFn: () => complianceTypesApi.list(companyId),
    enabled: !!companyId,
  });

  const form = useForm<TypeFormValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: { code: '', name: '', category: 'STATUTORY_RETURN', frequency: 'MONTHLY' },
  });

  const createMutation = useMutation({
    mutationFn: (values: TypeFormValues) => complianceTypesApi.create({ ...values, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-types'] });
      toast.success('Compliance type created');
      setOpen(false);
      form.reset({ code: '', name: '', category: 'STATUTORY_RETURN', frequency: 'MONTHLY' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => complianceTypesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-types'] });
      toast.success('Compliance type removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Compliance Types</CardTitle>
          <CardDescription>Master list of statutory returns, licenses and audits to track</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!companyId}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Compliance Type</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Code</Label>
                  <Input {...form.register('code')} placeholder="e.g. LWF_RETURN" />
                </div>
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...form.register('name')} placeholder="e.g. LWF Return" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input {...form.register('category')} placeholder="e.g. STATUTORY_RETURN" />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select value={form.watch('frequency')} onValueChange={(v) => form.setValue('frequency', v as TypeFormValues['frequency'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                      <SelectItem value="ANNUALLY">Annually</SelectItem>
                      <SelectItem value="ONE_TIME">One Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create type
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
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Frequency</TableHead>
              <TableHead className="text-xs" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {types?.map((t) => (
              <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-semibold text-primary">{t.code}</TableCell>
                <TableCell className="text-xs font-semibold text-foreground">{t.name}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant="secondary" className="text-[10px] font-semibold">{t.category}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <Badge variant="outline" className={`text-[10px] font-semibold ${t.frequency === 'MONTHLY'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : t.frequency === 'QUARTERLY'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                    }`}>
                    {t.frequency}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10" onClick={() => deleteMutation.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {types && types.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  No compliance types yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
