import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { payrollRunsApi, payslipsApi } from '@/api/payroll';
import type { Payslip } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function PayslipsTab({ companyId }: { companyId?: string }) {
  const [payrollRunId, setPayrollRunId] = useState<string>('');
  const [viewing, setViewing] = useState<Payslip | null>(null);

  const { data: runs } = useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: () => payrollRunsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['payslips', payrollRunId],
    queryFn: () => payslipsApi.list({ payrollRunId: payrollRunId || undefined }),
  });

  const runLabel = (id: string) => {
    const run = runs?.find((r) => r.id === id);
    return run ? `${MONTH_NAMES[run.month - 1]} ${run.year}` : '-';
  };

  return (
    <Card className="shadow-2xs">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Payslips</CardTitle>
          <CardDescription>Generated payslips across all processed runs</CardDescription>
        </div>
        <div className="w-64">
          <Select value={payrollRunId} onValueChange={setPayrollRunId}>
            <SelectTrigger>
              <SelectValue placeholder="All runs" />
            </SelectTrigger>
            <SelectContent>
              {runs?.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {MONTH_NAMES[r.month - 1]} {r.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Employee</TableHead>
              <TableHead className="text-xs">Period</TableHead>
              <TableHead className="text-xs">Gross</TableHead>
              <TableHead className="text-xs">PF</TableHead>
              <TableHead className="text-xs">ESIC</TableHead>
              <TableHead className="text-xs">PT</TableHead>
              <TableHead className="text-xs">Net Pay</TableHead>
              <TableHead className="text-xs" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {payslips?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium">
                  {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '-'}
                  <span className="block text-[10px] text-muted-foreground">{p.employee?.employeeCode}</span>
                </TableCell>
                <TableCell className="text-xs">{runLabel(p.payrollRunId)}</TableCell>
                <TableCell className="text-xs">₹{p.grossEarnings.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-xs text-destructive">₹{p.pf.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-xs text-destructive">₹{p.esic.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-xs text-destructive">₹{p.professionalTax.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-xs font-semibold text-success">₹{p.netPay.toLocaleString('en-IN')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewing(p)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {payslips && payslips.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-xs text-muted-foreground">
                  No payslips yet. Process a payroll run to generate them.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Payslip - {viewing?.employee?.firstName} {viewing?.employee?.lastName}
              </DialogTitle>
            </DialogHeader>
            {viewing && (
              <div className="space-y-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Component</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-right text-xs">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewing.components?.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs">{c.name}</TableCell>
                        <TableCell className="text-xs">{c.type}</TableCell>
                        <TableCell className="text-right text-xs">₹{c.amount.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="text-xs font-medium" colSpan={2}>Provident Fund (statutory)</TableCell>
                      <TableCell className="text-right text-xs text-destructive">-₹{viewing.pf.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium" colSpan={2}>ESIC (statutory)</TableCell>
                      <TableCell className="text-right text-xs text-destructive">-₹{viewing.esic.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium" colSpan={2}>Professional Tax (statutory)</TableCell>
                      <TableCell className="text-right text-xs text-destructive">-₹{viewing.professionalTax.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between rounded-md bg-muted/40 p-3">
                  <span className="text-sm font-semibold">Net Pay</span>
                  <span className="text-sm font-semibold text-success">₹{viewing.netPay.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
