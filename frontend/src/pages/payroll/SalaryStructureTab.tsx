import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { salaryComponentsApi, salaryStructureApi } from '@/api/payroll';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const componentSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['EARNING', 'DEDUCTION']),
});
type ComponentFormValues = z.infer<typeof componentSchema>;

const assignSchema = z.object({
  salaryComponentId: z.string().min(1, 'Component is required'),
  monthlyAmount: z.string().min(1, 'Amount is required'),
  effectiveFrom: z.string().min(1, 'Effective date is required'),
});
type AssignFormValues = z.infer<typeof assignSchema>;

export function SalaryStructureTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>('');

  const { data: components } = useQuery({
    queryKey: ['salary-components', companyId],
    queryFn: () => salaryComponentsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'salary-structure-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
    enabled: !!companyId,
  });

  const { data: structure, isLoading: structureLoading } = useQuery({
    queryKey: ['salary-structure', employeeId],
    queryFn: () => salaryStructureApi.list(employeeId),
    enabled: !!employeeId,
  });

  const componentForm = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: { code: '', name: '', type: 'EARNING' },
  });

  const createComponentMutation = useMutation({
    mutationFn: (values: ComponentFormValues) => salaryComponentsApi.create({ ...values, companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component created');
      setComponentDialogOpen(false);
      componentForm.reset({ code: '', name: '', type: 'EARNING' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteComponentMutation = useMutation({
    mutationFn: (id: string) => salaryComponentsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast.success('Salary component removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const assignForm = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { salaryComponentId: '', monthlyAmount: '0', effectiveFrom: new Date().toISOString().slice(0, 10) },
  });

  const assignMutation = useMutation({
    mutationFn: (values: AssignFormValues) =>
      salaryStructureApi.assign({ employeeId, ...values, monthlyAmount: Number(values.monthlyAmount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structure', employeeId] });
      toast.success('Salary component assigned');
      setAssignDialogOpen(false);
      assignForm.reset({ salaryComponentId: '', monthlyAmount: '0', effectiveFrom: new Date().toISOString().slice(0, 10) });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: (id: string) => salaryStructureApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structure', employeeId] });
      toast.success('Component removed from structure');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const totalMonthly = structure?.reduce((sum, c) => sum + (c.salaryComponent?.type === 'DEDUCTION' ? -c.monthlyAmount : c.monthlyAmount), 0) ?? 0;

  return (
    <div className="space-y-4">
      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Salary Components</CardTitle>
            <CardDescription>Master list of earnings and deductions available for salary structures</CardDescription>
          </div>
          <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!companyId}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Component
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Salary Component</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={componentForm.handleSubmit((values) => createComponentMutation.mutate(values))}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Code</Label>
                    <Input {...componentForm.register('code')} placeholder="e.g. BONUS" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input {...componentForm.register('name')} placeholder="e.g. Annual Bonus" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={componentForm.watch('type')} onValueChange={(v) => componentForm.setValue('type', v as ComponentFormValues['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EARNING">Earning</SelectItem>
                      <SelectItem value="DEDUCTION">Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createComponentMutation.isPending}>
                    Create component
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
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {components?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-xs font-medium">{c.code}</TableCell>
                  <TableCell className="text-xs">{c.name}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={c.type === 'EARNING' ? 'success' : 'warning'} className="text-[10px]">
                      {c.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteComponentMutation.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {components && components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                    No salary components yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Employee Salary Structure</CardTitle>
            <CardDescription>Assign monthly earning/deduction amounts per employee</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-64">
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
            </div>
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!employeeId}>
                  <Plus className="mr-1.5 h-4 w-4" /> Assign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Salary Component</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={assignForm.handleSubmit((values) => assignMutation.mutate(values))}>
                  <div className="space-y-1.5">
                    <Label>Component</Label>
                    <Select value={assignForm.watch('salaryComponentId')} onValueChange={(v) => assignForm.setValue('salaryComponentId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select component" />
                      </SelectTrigger>
                      <SelectContent>
                        {components?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Monthly Amount</Label>
                      <Input type="number" step="0.01" {...assignForm.register('monthlyAmount')} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Effective From</Label>
                      <Input type="date" {...assignForm.register('effectiveFrom')} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={assignMutation.isPending}>
                      Assign component
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!employeeId ? (
            <p className="text-xs text-muted-foreground">Select an employee to view or edit their salary structure.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Component</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Monthly Amount</TableHead>
                    <TableHead className="text-xs">Effective From</TableHead>
                    <TableHead className="text-xs" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {structureLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  )}
                  {structure?.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-medium">{s.salaryComponent?.name}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant={s.salaryComponent?.type === 'EARNING' ? 'success' : 'warning'} className="text-[10px]">
                          {s.salaryComponent?.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">₹{s.monthlyAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs">{new Date(s.effectiveFrom).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAssignmentMutation.mutate(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {structure && structure.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        No components assigned yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {structure && structure.length > 0 && (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  Net monthly (before statutory deductions): <span className="text-foreground">₹{totalMonthly.toLocaleString('en-IN')}</span>
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
