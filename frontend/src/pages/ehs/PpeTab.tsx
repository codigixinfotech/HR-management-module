import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PackageMinus, Plus, Trash2 } from 'lucide-react';
import { ppeApi } from '@/api/ehs';
import { employeesApi } from '@/api/employees';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  stockQuantity: z.string().optional(),
});
type ItemFormValues = z.infer<typeof itemSchema>;

export function PpeTab({ companyId }: { companyId?: string }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [issueTarget, setIssueTarget] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const { data: items, isLoading } = useQuery({
    queryKey: ['ppe-items', companyId],
    queryFn: () => ppeApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'ppe-picker', companyId],
    queryFn: () => employeesApi.list({ page: 1, pageSize: 100, companyId }),
    enabled: !!companyId,
  });

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: '', category: '', stockQuantity: '0' },
  });

  const createMutation = useMutation({
    mutationFn: (values: ItemFormValues) =>
      ppeApi.create({ ...values, companyId, stockQuantity: values.stockQuantity ? Number(values.stockQuantity) : 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppe-items'] });
      toast.success('PPE item added');
      setAddOpen(false);
      form.reset({ name: '', category: '', stockQuantity: '0' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ppeApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppe-items'] });
      toast.success('PPE item removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  const issueMutation = useMutation({
    mutationFn: (id: string) => ppeApi.issue(id, { employeeId, quantity: Number(quantity) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ppe-items'] });
      toast.success('PPE issued');
      setIssueTarget(null);
      setEmployeeId('');
      setQuantity('1');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">PPE Inventory</CardTitle>
          <CardDescription>Helmets, gloves, safety shoes and other protective equipment stock</CardDescription>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!companyId}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add PPE Item</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input {...form.register('name')} placeholder="Safety Goggles" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input {...form.register('category')} placeholder="Eye Protection" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Initial Stock</Label>
                <Input type="number" {...form.register('stockQuantity')} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Add item
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
              <TableHead className="text-xs">Item</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Stock</TableHead>
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
            {items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs font-medium">{item.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                <TableCell className="text-xs">{item.stockQuantity}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIssueTarget(item.id)} disabled={item.stockQuantity <= 0}>
                    <PackageMinus className="mr-1 h-3 w-3" /> Issue
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-xs text-muted-foreground">
                  No PPE items yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={!!issueTarget} onOpenChange={(v) => !v && setIssueTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue PPE</DialogTitle>
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
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <DialogFooter>
                <Button disabled={!employeeId || issueMutation.isPending} onClick={() => issueTarget && issueMutation.mutate(issueTarget)}>
                  Confirm issue
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
