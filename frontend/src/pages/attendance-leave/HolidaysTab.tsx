import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, Building2, MapPin, Users, ShieldCheck, Info } from 'lucide-react';
import { holidaysApi } from '@/api/attendance-leave';
import { branchesApi } from '@/api/organization';
import { useCompany } from '@/context/CompanyContext';
import type { Company } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const holidaySchema = z.object({
  companyId: z.string().min(1, 'Company is required'),
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.string().default('Mandatory'),
  branchName: z.string().default('All Branches'),
  applicableCategory: z.string().default('All Employees'),
  otApplicable: z.boolean().default(true),
});

type HolidayFormValues = z.infer<typeof holidaySchema>;

export function HolidaysTab({ companyId, companies }: { companyId?: string; companies: Company[] }) {
  const queryClient = useQueryClient();
  const { activeCompanyId } = useCompany();
  const effectiveCompanyId = companyId || activeCompanyId;
  const [open, setOpen] = useState(false);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ['holidays', effectiveCompanyId],
    queryFn: () => holidaysApi.list(effectiveCompanyId),
  });

  const { data: allBranches = [] } = useQuery({
    queryKey: ['branches', effectiveCompanyId],
    queryFn: () => branchesApi.list(effectiveCompanyId),
  });

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: {
      companyId: effectiveCompanyId ?? companies[0]?.id ?? '',
      name: '',
      date: '',
      type: 'Mandatory',
      branchName: 'All Branches',
      applicableCategory: 'All Employees',
      otApplicable: true,
    },
  });

  useEffect(() => {
    if (effectiveCompanyId) {
      form.setValue('companyId', effectiveCompanyId);
    }
  }, [effectiveCompanyId, form]);

  const selectedCompanyId = form.watch('companyId') || effectiveCompanyId;

  // Dynamic branch list cascading from selected company
  const availableBranches = useMemo(() => {
    const list = [{ id: 'all-branches', name: 'All Branches' }];
    if (allBranches && allBranches.length > 0) {
      const filtered = allBranches.filter((b: any) => !selectedCompanyId || b.companyId === selectedCompanyId);
      list.push(...filtered);
    }
    return list;
  }, [allBranches, selectedCompanyId]);

  const createMutation = useMutation({
    mutationFn: (values: HolidayFormValues) => holidaysApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday declared with branch & employee category mappings!');
      setOpen(false);
      form.reset({
        companyId: effectiveCompanyId ?? companies[0]?.id ?? '',
        name: '',
        date: '',
        type: 'Mandatory',
        branchName: 'All Branches',
        applicableCategory: 'All Employees',
        otApplicable: true,
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to declare holiday'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => holidaysApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete holiday'),
  });

  // Helper: Format date DD/MM/YYYY
  const formatHolidayDate = (dateVal: string | undefined | null) => {
    if (!dateVal) return '-';
    try {
      const parts = dateVal.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateVal;
    }
  };

  // Helper: Get company name
  const getCompanyName = (compIdentifier: string | undefined | null) => {
    if (!compIdentifier) return 'Montanari Lifts Components Pvt. Ltd.';
    const found = companies.find((c) => c.id === compIdentifier || c.name === compIdentifier);
    return found?.name || 'Montanari Lifts Components Pvt. Ltd.';
  };

  return (
    <Card className="shadow-xs border-border/80">
      <CardHeader className="p-4 pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Corporate Holiday Calendar</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                OT Engine Synced
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Declared national, festival, and regional holidays mapped to Company, Branch, and Employee Categories.
            </CardDescription>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs font-semibold gap-1.5 shadow-2xs">
                <Plus className="h-3.5 w-3.5" /> Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Declare Corporate Holiday</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Configure company, branch applicability, employee category rules, and overtime qualification.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-3.5 pt-1" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                {/* Name & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Holiday Name *</Label>
                    <Input
                      placeholder="e.g. Ganesh Chaturthi"
                      className="h-8 text-xs"
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <p className="text-[10px] text-rose-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Date *</Label>
                    <Input type="date" className="h-8 text-xs font-mono" {...form.register('date')} />
                    {form.formState.errors.date && (
                      <p className="text-[10px] text-rose-600">{form.formState.errors.date.message}</p>
                    )}
                  </div>
                </div>

                {/* Type & OT Applicable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Holiday Type *</Label>
                    <Select value={form.watch('type')} onValueChange={(v) => form.setValue('type', v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mandatory">Mandatory (National)</SelectItem>
                        <SelectItem value="Regional">Regional (State Festival)</SelectItem>
                        <SelectItem value="Restricted / Optional">Restricted / Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">OT Applicable If Worked? *</Label>
                    <Select
                      value={form.watch('otApplicable') ? 'true' : 'false'}
                      onValueChange={(v) => form.setValue('otApplicable', v === 'true')}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes (Statutory 2× OT Multiplier)</SelectItem>
                        <SelectItem value="false">No (Comp-off / Standard Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Company & Branch (Cascading) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Company *</Label>
                    <Select
                      value={form.watch('companyId')}
                      onValueChange={(v) => {
                        form.setValue('companyId', v);
                        form.setValue('branchName', 'All Branches');
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Branch / Establishment *</Label>
                    <Select value={form.watch('branchName')} onValueChange={(v) => form.setValue('branchName', v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBranches.map((b) => (
                          <SelectItem key={b.id} value={b.name} className="text-xs">
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Applicable Employee Category */}
                <div className="space-y-1">
                  <Label className="text-xs">Applicable Employee Category *</Label>
                  <Select
                    value={form.watch('applicableCategory')}
                    onValueChange={(v) => form.setValue('applicableCategory', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Employees">All Employees (Global Enterprise Scope)</SelectItem>
                      <SelectItem value="Factory Workers & Plant Technicians">Factory Workers & Plant Technicians</SelectItem>
                      <SelectItem value="Office & Administrative Staff">Office & Administrative Staff</SelectItem>
                      <SelectItem value="Continuous Process Operations">Continuous Process Operations (Boiler/Furnace)</SelectItem>
                      <SelectItem value="Warehouse & Logistics Team">Warehouse & Logistics Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notice on separation of Holiday Identification vs OT Policy Calculation */}
                <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Holiday Calendar Scope: </span>
                    Identifies whether a date is a recognized holiday and which company/branch/category it applies to. Overtime threshold rules, 2× statutory multipliers, and payroll syncing are calculated dynamically by the <strong>Overtime Policy Master</strong>.
                  </div>
                </div>

                <DialogFooter className="pt-2 border-t">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={createMutation.isPending} className="font-semibold">
                    Declare Holiday
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-muted-foreground">
                <TableHead className="text-xs font-semibold">Holiday Name</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Company</TableHead>
                <TableHead className="text-xs font-semibold">Branch</TableHead>
                <TableHead className="text-xs font-semibold">Applicable Category</TableHead>
                <TableHead className="text-center text-xs font-semibold">OT Applicable</TableHead>
                <TableHead className="text-center text-xs font-semibold">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/40 text-xs">
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    Loading holiday calendar...
                  </TableCell>
                </TableRow>
              )}
              {holidays?.map((holiday) => (
                <TableRow key={holiday.id} className="hover:bg-muted/30">
                  <TableCell className="font-semibold text-foreground">
                    <div>{holiday.name}</div>
                  </TableCell>
                  <TableCell className="font-mono font-medium text-muted-foreground whitespace-nowrap">
                    {formatHolidayDate(holiday.date)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold whitespace-nowrap ${
                        holiday.type === 'Mandatory'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : holiday.type === 'Regional'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {holiday.type || 'Mandatory'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium text-[11px] max-w-[150px] truncate" title={getCompanyName(holiday.companyId)}>
                    {getCompanyName(holiday.companyId)}
                  </TableCell>
                  <TableCell className="text-foreground font-medium text-[11px] whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{holiday.branchName || holiday.applicableTarget || 'All Branches'}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-medium text-[11px]">
                    {holiday.applicableCategory || 'All Employees'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] font-bold ${
                        holiday.otApplicable !== false
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-zinc-100 text-zinc-500 border-zinc-300'
                      }`}
                    >
                      {holiday.otApplicable !== false ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border-emerald-300"
                    >
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
                      onClick={() => deleteMutation.mutate(holiday.id)}
                      title="Delete Holiday"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {holidays && holidays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                    No corporate holidays configured.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

