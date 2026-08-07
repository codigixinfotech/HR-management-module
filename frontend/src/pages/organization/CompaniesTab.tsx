import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, CheckCircle2 } from 'lucide-react';
import { companiesApi } from '@/api/organization';
import type { Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const companySchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  legalName: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  timezone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export function CompaniesTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery({ queryKey: ['companies'], queryFn: companiesApi.list });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { code: '', name: '', legalName: '', country: 'USA', currency: 'USD', timezone: 'America/New_York' },
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) =>
      editing ? companiesApi.update(editing.id, values) : companiesApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success(editing ? 'Company updated' : 'Company created');
      setOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ code: '', name: '', legalName: '', country: 'USA', currency: 'USD', timezone: 'America/New_York' });
    setOpen(true);
  };

  const openEdit = (company: Company) => {
    setEditing(company);
    form.reset({
      code: company.code,
      name: company.name,
      legalName: company.legalName ?? '',
      country: company.country,
      currency: company.currency,
      timezone: company.timezone,
    });
    setOpen(true);
  };

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Corporate Legal Entities
            </CardTitle>
            <CardDescription className="text-xs">
              Parent holding company & registered corporate legal entities
            </CardDescription>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5" /> Add Entity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Corporate Entity' : 'Add Corporate Entity'}</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={form.handleSubmit((values) => upsertMutation.mutate(values))}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Entity Code</Label>
                    <Input placeholder="e.g. COMP-01" {...form.register('code')} className="h-9 text-xs font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Name</Label>
                    <Input placeholder="e.g. StockPulse Inc." {...form.register('name')} className="h-9 text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Registered Legal Name</Label>
                  <Input placeholder="e.g. StockPulse Technologies Private Limited" {...form.register('legalName')} className="h-9 text-xs" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country</Label>
                    <Input {...form.register('country')} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Currency</Label>
                    <Input {...form.register('currency')} className="h-9 text-xs font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Timezone</Label>
                    <Input {...form.register('timezone')} className="h-9 text-xs" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" size="sm" className="text-xs" disabled={upsertMutation.isPending}>
                    {editing ? 'Save Changes' : 'Create Entity'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Company Name</TableHead>
              <TableHead className="text-xs">Legal Registered Name</TableHead>
              <TableHead className="text-xs">Country & Currency</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-right text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                  Loading corporate entities...
                </TableCell>
              </TableRow>
            )}
            {companies?.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-mono text-xs font-semibold text-primary">{company.code}</TableCell>
                <TableCell className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  {company.name}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">{company.legalName ?? company.name}</TableCell>
                <TableCell className="text-xs font-medium">
                  {company.country} ({company.currency})
                </TableCell>
                <TableCell className="text-xs">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Registered Entity
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(company)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(company.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
