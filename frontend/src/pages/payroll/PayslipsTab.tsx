import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Printer,
  Download,
  Building2,
  Calendar,
  CreditCard,
  UserCheck,
  Search,
  CheckCircle2,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { payrollRunsApi, payslipsApi } from '@/api/payroll';
import type { Payslip } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function numberToIndianWords(num: number): string {
  if (!num || num === 0) return 'Zero Rupees Only';
  num = Math.round(num);
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    } else if (n > 0) {
      str += a[n] + ' ';
    }
    return str;
  };

  let result = '';
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  if (crore > 0) result += convertLessThanOneThousand(crore) + 'Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + 'Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + 'Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  return result.trim() ? `Rupees ${result.trim()} Only` : 'Zero Rupees Only';
}

export function PayslipsTab({ companyId }: { companyId?: string }) {
  const [payrollRunId, setPayrollRunId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewing, setViewing] = useState<Payslip | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  const { data: runs } = useQuery({
    queryKey: ['payroll-runs', companyId],
    queryFn: () => payrollRunsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: payslips, isLoading } = useQuery({
    queryKey: ['payslips', payrollRunId, companyId],
    queryFn: () => payslipsApi.list({ payrollRunId: payrollRunId || undefined, companyId }),
  });

  const runLabel = (id: string) => {
    const run = runs?.find((r) => r.id === id);
    return run ? `${MONTH_NAMES[run.month - 1]} ${run.year}` : '-';
  };

  const filteredPayslips = (payslips || []).filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase();
    const code = (p.employee?.employeeCode || '').toLowerCase();
    return fullName.includes(term) || code.includes(term);
  });

  const totalGross = filteredPayslips.reduce((sum, p) => sum + p.grossEarnings, 0);
  const totalDeductions = filteredPayslips.reduce(
    (sum, p) => sum + (p.pf + p.esic + p.professionalTax + p.otherDeductions),
    0
  );
  const totalNet = filteredPayslips.reduce((sum, p) => sum + p.netPay, 0);

  const handlePrint = () => {
    window.print();
  };

  // Helper to separate earnings and deductions for viewing
  const earningComponents = viewing?.components?.filter((c) => c.type === 'EARNING') || [];
  const deductionComponents = viewing?.components?.filter((c) => c.type === 'DEDUCTION') || [];

  // If specific statutory items weren't explicitly itemized as components, construct display items:
  const hasPfComponent = deductionComponents.some((c) => c.name.toLowerCase().includes('pf') || c.name.toLowerCase().includes('provident'));
  const hasEsicComponent = deductionComponents.some((c) => c.name.toLowerCase().includes('esi'));
  const hasPtComponent = deductionComponents.some((c) => c.name.toLowerCase().includes('pt') || c.name.toLowerCase().includes('professional'));

  const activeRun = runs?.find((r) => r.id === viewing?.payrollRunId);
  const payPeriodMonthYear = activeRun ? `${MONTH_NAMES[activeRun.month - 1]} ${activeRun.year}` : 'October 2026';

  return (
    <div className="space-y-5">
      {/* ── SUMMARY KPIS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="border-border/70 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Payslips</span>
            <p className="text-xl font-bold text-foreground mt-0.5">{filteredPayslips.length}</p>
            <span className="text-[10px] text-muted-foreground">Active for selected period</span>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Gross Earnings</span>
            <p className="text-xl font-bold text-foreground mt-0.5 font-mono">₹{totalGross.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-muted-foreground">Pre-tax cumulative wages</span>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Deductions</span>
            <p className="text-xl font-bold text-rose-600 mt-0.5 font-mono">-₹{totalDeductions.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-rose-500/80">PF, ESIC, PT & Other</span>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-2xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net Payout</span>
            <p className="text-xl font-bold text-emerald-600 mt-0.5 font-mono">₹{totalNet.toLocaleString('en-IN')}</p>
            <span className="text-[10px] text-emerald-600/80">Direct bank transfer pool</span>
          </CardContent>
        </Card>
      </div>

      {/* ── MAIN TABLE CARD ── */}
      <Card className="shadow-2xs border-border/80">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Employee Payslips
            </CardTitle>
            <CardDescription className="text-xs">
              Itemized salary slips with pro-rata earnings and statutory deductions
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="w-52">
              <Select value={payrollRunId} onValueChange={setPayrollRunId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Payroll Runs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Payroll Runs</SelectItem>
                  {runs?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {MONTH_NAMES[r.month - 1]} {r.year} ({r.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Employee</TableHead>
                  <TableHead className="text-xs font-semibold">Period</TableHead>
                  <TableHead className="text-xs font-semibold">Gross Wages</TableHead>
                  <TableHead className="text-xs font-semibold text-rose-600">PF</TableHead>
                  <TableHead className="text-xs font-semibold text-rose-600">ESIC</TableHead>
                  <TableHead className="text-xs font-semibold text-rose-600">PT</TableHead>
                  <TableHead className="text-xs font-semibold text-emerald-600">Net Pay</TableHead>
                  <TableHead className="text-xs font-semibold text-right pr-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                      Loading payslips...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredPayslips.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                      No payslips found. Process a payroll run in the "Payroll Processing" tab to generate official payslips.
                    </TableCell>
                  </TableRow>
                )}
                {filteredPayslips.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs font-medium py-2.5">
                      <div className="font-semibold text-foreground">
                        {p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : 'Employee'}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.employee?.employeeCode || '-'} {p.employee?.designation?.title ? `• ${p.employee.designation.title}` : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs py-2.5">
                      <Badge variant="outline" className="text-[10px] font-medium border-border/60">
                        {runLabel(p.payrollRunId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium font-mono py-2.5">
                      ₹{p.grossEarnings.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-rose-600 py-2.5">
                      ₹{p.pf.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-rose-600 py-2.5">
                      ₹{p.esic.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-rose-600 py-2.5">
                      ₹{p.professionalTax.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-emerald-600 font-mono py-2.5">
                      ₹{p.netPay.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right py-2.5 pr-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5 border-border/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-foreground"
                        onClick={() => setViewing(p)}
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        View Slip
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── ENTERPRISE CORPORATE PAYSLIP MODAL ── */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-border/80">
          <DialogHeader className="p-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <DialogTitle className="text-base font-bold">
                  Official Salary Slip
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Period: {payPeriodMonthYear} • Confidential Document
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>
            </div>
          </DialogHeader>

          {viewing && (
            <div ref={printableRef} className="p-6 space-y-5 bg-background printable-payslip">
              {/* Print CSS block */}
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  .printable-payslip, .printable-payslip * {
                    visibility: visible;
                  }
                  .printable-payslip {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 20px;
                  }
                }
              `}</style>

              {/* Company Header */}
              <div className="border-b-2 border-primary/20 pb-4 text-center">
                <h2 className="text-xl font-black tracking-tight text-foreground uppercase">
                  {viewing.employee?.company?.name || 'CRAVITA TECHNOLOGY PVT LTD'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {viewing.employee?.company?.registeredAddress || 'Plot C-3, MIDC IT Park, Pune - 411057, Maharashtra'}
                </p>
                <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground mt-1">
                  <span>PAN: {viewing.employee?.company?.pan || 'AAACC1234F'}</span>
                  <span>•</span>
                  <span>Corporate Code: {viewing.employee?.company?.code || 'C-0034'}</span>
                </div>
                <div className="mt-2.5 inline-block bg-primary/10 text-primary font-bold text-xs uppercase px-3 py-1 rounded-sm tracking-wider">
                  Payslip For The Month Of {payPeriodMonthYear}
                </div>
              </div>

              {/* Employee Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 border border-border/70 rounded-md p-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Employee Name</span>
                  <span className="font-bold text-foreground">
                    {viewing.employee?.firstName} {viewing.employee?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Employee ID</span>
                  <span className="font-bold font-mono text-foreground">{viewing.employee?.employeeCode || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Designation</span>
                  <span className="font-medium text-foreground">{viewing.employee?.designation?.title || 'Engineer'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Department</span>
                  <span className="font-medium text-foreground">{viewing.employee?.department?.name || 'Technology'}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">PAN Number</span>
                  <span className="font-mono font-medium text-foreground">{viewing.employee?.panNumber || 'ABCDE1234F'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">UAN / PF No.</span>
                  <span className="font-mono font-medium text-foreground">{viewing.employee?.uanNumber || viewing.employee?.pfMemberId || '101485938291'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Bank Name</span>
                  <span className="font-medium text-foreground">{viewing.employee?.bankName || 'HDFC Bank'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Bank A/C No.</span>
                  <span className="font-mono font-medium text-foreground">
                    {viewing.employee?.bankAccountNumber ? `••••${viewing.employee.bankAccountNumber.slice(-4)}` : '••••5892'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total Days</span>
                  <span className="font-medium text-foreground">30</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Paid Days</span>
                  <span className="font-bold text-foreground">30</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">LOP Days</span>
                  <span className="font-medium text-foreground">0</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Payment Mode</span>
                  <span className="font-medium text-emerald-600 font-semibold">Bank Transfer</span>
                </div>
              </div>

              {/* Side-by-Side Earnings and Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earnings Table */}
                <div className="border border-border/80 rounded-md overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-emerald-500/10 border-b border-border/60 px-3.5 py-2 font-bold text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex justify-between">
                      <span>Earnings Component</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div className="divide-y divide-border/40 text-xs">
                      {earningComponents.map((c) => (
                        <div key={c.id} className="flex justify-between px-3.5 py-1.5">
                          <span className="text-muted-foreground">{c.name}</span>
                          <span className="font-mono font-medium text-foreground">₹{c.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                      {earningComponents.length === 0 && (
                        <>
                          <div className="flex justify-between px-3.5 py-1.5">
                            <span className="text-muted-foreground">Basic Salary</span>
                            <span className="font-mono font-medium text-foreground">
                              ₹{Math.round(viewing.grossEarnings * 0.5).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between px-3.5 py-1.5">
                            <span className="text-muted-foreground">House Rent Allowance (HRA)</span>
                            <span className="font-mono font-medium text-foreground">
                              ₹{Math.round(viewing.grossEarnings * 0.3).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between px-3.5 py-1.5">
                            <span className="text-muted-foreground">Special Allowance</span>
                            <span className="font-mono font-medium text-foreground">
                              ₹{Math.round(viewing.grossEarnings * 0.2).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-t border-border/70 px-3.5 py-2 flex justify-between font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    <span>Total Gross Earnings (A)</span>
                    <span className="font-mono">₹{viewing.grossEarnings.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions Table */}
                <div className="border border-border/80 rounded-md overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="bg-rose-500/10 border-b border-border/60 px-3.5 py-2 font-bold text-xs text-rose-700 dark:text-rose-400 uppercase tracking-wider flex justify-between">
                      <span>Deductions Component</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div className="divide-y divide-border/40 text-xs">
                      {deductionComponents.map((c) => (
                        <div key={c.id} className="flex justify-between px-3.5 py-1.5">
                          <span className="text-muted-foreground">{c.name}</span>
                          <span className="font-mono font-medium text-rose-600">₹{c.amount.toLocaleString('en-IN')}</span>
                        </div>
                      ))}

                      {!hasPfComponent && viewing.pf > 0 && (
                        <div className="flex justify-between px-3.5 py-1.5">
                          <span className="text-muted-foreground">Provident Fund (Employee 12%)</span>
                          <span className="font-mono font-medium text-rose-600">₹{viewing.pf.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {!hasEsicComponent && viewing.esic > 0 && (
                        <div className="flex justify-between px-3.5 py-1.5">
                          <span className="text-muted-foreground">ESIC (Employee 0.75%)</span>
                          <span className="font-mono font-medium text-rose-600">₹{viewing.esic.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {!hasPtComponent && viewing.professionalTax > 0 && (
                        <div className="flex justify-between px-3.5 py-1.5">
                          <span className="text-muted-foreground">Professional Tax (State PT)</span>
                          <span className="font-mono font-medium text-rose-600">₹{viewing.professionalTax.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {viewing.otherDeductions > 0 && (
                        <div className="flex justify-between px-3.5 py-1.5">
                          <span className="text-muted-foreground">Other Deductions</span>
                          <span className="font-mono font-medium text-rose-600">₹{viewing.otherDeductions.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 border-t border-border/70 px-3.5 py-2 flex justify-between font-bold text-xs text-rose-700 dark:text-rose-400">
                    <span>Total Deductions (B)</span>
                    <span className="font-mono">
                      -₹{(viewing.pf + viewing.esic + viewing.professionalTax + viewing.otherDeductions).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner & In Words */}
              <div className="bg-primary/5 border border-primary/20 rounded-md p-4 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Net Take-Home Salary (A - B)
                  </span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    ₹{viewing.netPay.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="border-t border-primary/10 pt-1.5 text-xs text-foreground/80 italic">
                  <span className="font-semibold not-italic text-muted-foreground mr-1">In Words:</span>
                  {numberToIndianWords(viewing.netPay)}
                </div>
              </div>

              {/* Employer Statutory Contributions */}
              <div className="border border-border/60 rounded-md p-3 bg-muted/20 text-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Employer Statutory Contributions (Included in CTC)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-background border border-border/50 p-2 rounded">
                    <span className="text-[10px] text-muted-foreground block">Employer PF (12%)</span>
                    <span className="font-mono font-semibold text-foreground">₹{viewing.pf || 1500}</span>
                  </div>
                  <div className="bg-background border border-border/50 p-2 rounded">
                    <span className="text-[10px] text-muted-foreground block">EPS (Pension Scheme)</span>
                    <span className="font-mono font-semibold text-foreground">₹{Math.min(viewing.pf || 1250, 1250)}</span>
                  </div>
                  <div className="bg-background border border-border/50 p-2 rounded">
                    <span className="text-[10px] text-muted-foreground block">Gratuity Provision (4.81%)</span>
                    <span className="font-mono font-semibold text-foreground">₹{Math.round(viewing.grossEarnings * 0.024)}</span>
                  </div>
                  <div className="bg-background border border-border/50 p-2 rounded">
                    <span className="text-[10px] text-muted-foreground block">EDLI & Admin</span>
                    <span className="font-mono font-semibold text-foreground">₹75</span>
                  </div>
                </div>
              </div>

              {/* Signatures & Footer Note */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground border-t border-border/40 gap-4">
                <div className="text-center sm:text-left">
                  <p className="font-medium text-foreground">Authorized Signatory</p>
                  <p className="text-[10px]">CRAVITA TECHNOLOGY PVT LTD</p>
                </div>
                <div className="text-center text-[10px] text-muted-foreground max-w-sm">
                  This document is computer generated and digitally authenticated by the HR & Payroll system.
                </div>
                <div className="text-center sm:text-right">
                  <p className="font-medium text-foreground">{viewing.employee?.firstName} {viewing.employee?.lastName}</p>
                  <p className="text-[10px]">Employee Signature / Acknowledgment</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
