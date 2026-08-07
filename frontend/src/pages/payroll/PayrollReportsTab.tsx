import { useQuery } from '@tanstack/react-query';
import { payrollRunsApi, payslipsApi } from '@/api/payroll';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function PayrollReportsTab({ companyId }: { companyId?: string }) {
  const { data: runs, isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: () => payrollRunsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: payslips, isLoading: payslipsLoading } = useQuery({
    queryKey: ['payslips', ''],
    queryFn: () => payslipsApi.list({}),
  });

  const isLoading = runsLoading || payslipsLoading;

  const rows = (runs ?? [])
    .filter((r) => r.status !== 'DRAFT')
    .map((run) => {
      const runPayslips = payslips?.filter((p) => p.payrollRunId === run.id) ?? [];
      return {
        run,
        employees: runPayslips.length,
        gross: runPayslips.reduce((sum, p) => sum + p.grossEarnings, 0),
        deductions: runPayslips.reduce((sum, p) => sum + p.pf + p.esic + p.professionalTax + p.otherDeductions, 0),
        net: runPayslips.reduce((sum, p) => sum + p.netPay, 0),
      };
    });

  return (
    <Card className="shadow-2xs">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Payroll Cost Summary</CardTitle>
        <CardDescription>Gross, statutory deductions and net payout by processed run</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Period</TableHead>
              <TableHead className="text-xs">Employees Paid</TableHead>
              <TableHead className="text-xs">Gross</TableHead>
              <TableHead className="text-xs">Deductions</TableHead>
              <TableHead className="text-xs">Net Payout</TableHead>
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
              rows.map(({ run, employees, gross, deductions, net }) => (
                <TableRow key={run.id}>
                  <TableCell className="text-xs font-medium">
                    {MONTH_NAMES[run.month - 1]} {run.year}
                  </TableCell>
                  <TableCell className="text-xs">{employees}</TableCell>
                  <TableCell className="text-xs">₹{gross.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-xs text-destructive">₹{deductions.toLocaleString('en-IN')}</TableCell>
                  <TableCell className="text-xs font-semibold text-success">₹{net.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                  No processed payroll runs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
